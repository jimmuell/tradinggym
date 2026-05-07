import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import type { CandlestickData, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import BlueprintChecklist from '@/components/chart/BlueprintChecklist';
import FinancialDisclaimer from '@/components/FinancialDisclaimer';
import { usePlaybackScenario } from '@/hooks/usePlaybackScenario';
import { usePlaybackMode } from '@/hooks/usePlaybackMode';
import PlaybackOverlay from '@/components/playback/PlaybackOverlay';
import AnnotationLayer from '@/components/playback/AnnotationLayer';
import { Sparkles, BookOpen, Lock } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Simulator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const playbackId = searchParams.get('playback');
  const practiceMode = searchParams.get('practice') === '1';

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
  const [chartApiState, setChartApiState] = useState<IChartApi | null>(null);
  const [seriesApiState, setSeriesApiState] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [blueprintSteps, setBlueprintSteps] = useState<number[]>([]);
  const [blueprintResetKey, setBlueprintResetKey] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentKey>(() =>
    (localStorage.getItem('tg-selected-instrument') as InstrumentKey) || 'MES'
  );

  // ---- Playback ----
  const isPlaybackMode = !!playbackId && !practiceMode;
  const { data: scenario } = usePlaybackScenario(playbackId);
  const [playbackBarCount, setPlaybackBarCount] = useState(0);

  const playbackCandles: CandlestickData<Time>[] | undefined = useMemo(() => {
    if (!scenario) return undefined;
    return scenario.ohlcv_data.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  }, [scenario]);

  const playback = usePlaybackMode({
    scenario,
    onBarIndexChange: setPlaybackBarCount,
  });

  // Practice mode bootstrap: when ?practice=1 with the same scenario, render the candles
  // but let the user trade. We feed all candles and let the user act on the last bar.
  const isPracticeWithScenario = !!playbackId && practiceMode && !!scenario;

  const handleTryItYourself = () => {
    setSearchParams({ playback: playbackId!, practice: '1' });
  };

  const exitPlayback = () => {
    setSearchParams({});
    navigate('/strategies');
  };

  const handleInstrumentChange = (inst: InstrumentKey) => {
    setInstrument(inst);
    localStorage.setItem('tg-selected-instrument', inst);
  };

  // Keyboard shortcuts for drawing tools + Escape (disabled during playback)
  useEffect(() => {
    if (isPlaybackMode) return;
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
  }, [isPlaybackMode]);

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
          <div className="px-3 pt-2">
            <FinancialDisclaimer />
          </div>
          {!isPlaybackMode && !isPracticeWithScenario && <SimulatorHintBanner />}
          {isPracticeWithScenario && scenario && (
            <div className="px-3 py-2 bg-primary/10 border-b border-primary/30 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[13px] text-foreground">
                <span className="font-semibold">Practice mode:</span> {scenario.name} — try entering at ~{scenario.entry_price.toFixed(2)} with stop {scenario.stop_price.toFixed(2)} and target {scenario.target_price.toFixed(2)}.
              </span>
              <button
                onClick={() => setSearchParams({ playback: playbackId! })}
                className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" /> Watch demo again
              </button>
            </div>
          )}
          <div className="flex flex-1 overflow-hidden">
            {!isPlaybackMode && (
              <LeftToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                drawingCount={drawingCount}
                onClearAll={() => (window as Window & { __drawingOverlayClearAll?: () => void }).__drawingOverlayClearAll?.()}
              />
            )}
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
                setChartApiState(chart);
                setSeriesApiState(series);
              }}
              instrument={instrument}
              playbackMode={isPlaybackMode}
              playbackCandles={isPlaybackMode ? playbackCandles : undefined}
              playbackBarCount={isPlaybackMode ? playbackBarCount : undefined}
              playbackChildren={
                isPlaybackMode && scenario ? (
                  <>
                    <AnnotationLayer
                      chartApi={chartApiState}
                      seriesApi={seriesApiState}
                      scenario={scenario}
                      currentPhase={playback.phase}
                      visibleBarCount={playbackBarCount}
                    />
                    <PlaybackOverlay
                      scenario={scenario}
                      phase={playback.phase}
                      isPlaying={playback.isPlaying}
                      speed={playback.speed}
                      onPlay={playback.play}
                      onPause={playback.pause}
                      onStepBack={playback.stepBack}
                      onStepForward={playback.stepForward}
                      onReset={playback.reset}
                      onExit={exitPlayback}
                      onSpeedChange={playback.setSpeed}
                      onGoToPhase={playback.goToPhase}
                      onTryItYourself={handleTryItYourself}
                    />
                  </>
                ) : null
              }
            />
            {!isPlaybackMode && <RightToolbar />}
            {!isPlaybackMode && (
              <BlueprintChecklist
                onStepsChange={setBlueprintSteps}
                resetKey={blueprintResetKey}
              />
            )}
            {tradeOpen && !isPlaybackMode && (
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
          {!isPlaybackMode && <BottomBar />}
        </div>
      </div>
    </SidebarProvider>
  );
}
