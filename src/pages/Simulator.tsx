import { useState, useRef, useEffect, useCallback } from 'react';
import SimulatorHintBanner from '@/components/chart/SimulatorHintBanner';
import { SLTPConfig } from '@/components/chart/TradeOrderPanel';
import TopBar from '@/components/chart/TopBar';
import LeftToolbar from '@/components/chart/LeftToolbar';
import RightToolbar from '@/components/chart/RightToolbar';
import BottomBar from '@/components/chart/BottomBar';
import ChartContainer, { TradeCloseData } from '@/components/chart/ChartContainer';
import TradeOrderPanel from '@/components/chart/TradeOrderPanel';
import { Timeframe } from '@/lib/chartData';
import { InstrumentKey } from '@/lib/instruments';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DrawingTool } from '@/lib/drawingTypes';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import BlueprintChecklist from '@/components/chart/BlueprintChecklist';

export default function Simulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tradeOpen, setTradeOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [replayMode, setReplayMode] = useState(false);
  const [lastPrice, setLastPrice] = useState(6500);
  const buyHandlerRef = useRef<((config: SLTPConfig) => void) | null>(null);
  const sellHandlerRef = useRef<((config: SLTPConfig) => void) | null>(null);
  const [draggedSlTicks, setDraggedSlTicks] = useState<number | null>(null);
  const [draggedTpTicks, setDraggedTpTicks] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>(null);
  const [drawingCount, setDrawingCount] = useState(0);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesApiRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [blueprintSteps, setBlueprintSteps] = useState<number[]>([]);
  const [blueprintResetKey, setBlueprintResetKey] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentKey>(() =>
    (localStorage.getItem('tg-selected-instrument') as InstrumentKey) || 'MES'
  );

  const handleInstrumentChange = (inst: InstrumentKey) => {
    setInstrument(inst);
    localStorage.setItem('tg-selected-instrument', inst);
  };

  // Keyboard shortcuts for drawing tools + Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'h': setActiveTool(prev => prev === 'horizontal' ? null : 'horizontal'); break;
        case 't': setActiveTool(prev => prev === 'trendline' ? null : 'trendline'); break;
        case 'r': setActiveTool(prev => prev === 'rectangle' ? null : 'rectangle'); break;
        case 'l': setActiveTool(prev => prev === 'text' ? null : 'text'); break;
        case 'escape': setActiveTool(null); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const saveTradeMutation = useMutation({
    mutationFn: async (data: TradeCloseData & { stepsCompleted?: number[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: instrument,
        timeframe,
        direction: data.direction,
        entry_price: data.entryPrice,
        exit_price: data.exitPrice,
        stop_loss: data.slPrice,
        take_profit: data.tpPrice,
        result: data.result,
        pnl: data.pnl,
        pnl_ticks: data.pnlTicks,
        session_type: 'simulator',
        steps_completed: data.stepsCompleted ?? [],
        opened_at: data.openedAt,
        closed_at: data.closedAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    },
    onError: (err: Error) => {
      toast.error('Failed to save trade: ' + err.message);
    },
  });

  const handleTradeClose = (data: TradeCloseData) => {
    saveTradeMutation.mutate({ ...data, stepsCompleted: blueprintSteps });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center bg-card border-b border-border">
            <SidebarTrigger className="ml-2 text-muted-foreground hover:text-foreground shrink-0" />
            <div className="flex-1">
              <TopBar
                onTradeClick={() => setTradeOpen(!tradeOpen)}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onReplayClick={() => setReplayMode(!replayMode)}
                replayMode={replayMode}
                instrument={instrument}
                onInstrumentChange={handleInstrumentChange}
              />
            </div>
          </div>
          <SimulatorHintBanner />
          <div className="flex flex-1 overflow-hidden">
            <LeftToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              drawingCount={drawingCount}
              onClearAll={() => (window as Window & { __drawingOverlayClearAll?: () => void }).__drawingOverlayClearAll?.()}
            />
            <ChartContainer
              timeframe={timeframe}
              replayMode={replayMode}
              onExitReplay={() => setReplayMode(false)}
              onPriceUpdate={setLastPrice}
              onRegisterBuyHandler={(handler) => {
                buyHandlerRef.current = handler;
              }}
              onRegisterSellHandler={(handler) => {
                sellHandlerRef.current = handler;
              }}
              onSLTPDrag={(type, ticks) => {
                if (type === 'sl') setDraggedSlTicks(ticks);
                else setDraggedTpTicks(ticks);
              }}
              onTradeClose={handleTradeClose}
              activeTool={activeTool}
              isCoachMode={false}
              onDrawingCountChange={setDrawingCount}
              onChartReady={(chart, series) => {
                chartApiRef.current = chart;
                seriesApiRef.current = series;
              }}
              instrument={instrument}
            />
            <RightToolbar />
            <BlueprintChecklist
              onStepsChange={setBlueprintSteps}
              resetKey={blueprintResetKey}
            />
            {tradeOpen && (
              <TradeOrderPanel
                onClose={() => setTradeOpen(false)}
                lastPrice={lastPrice}
                onBuy={(config) => { buyHandlerRef.current?.(config); }}
                onSell={(config) => { sellHandlerRef.current?.(config); }}
                externalSlTicks={draggedSlTicks}
                externalTpTicks={draggedTpTicks}
                instrument={instrument}
              />
            )}
          </div>
          <BottomBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
