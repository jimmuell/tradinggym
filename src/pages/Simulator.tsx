import { useState, useRef } from 'react';
import { SLTPConfig } from '@/components/chart/TradeOrderPanel';
import TopBar from '@/components/chart/TopBar';
import LeftToolbar from '@/components/chart/LeftToolbar';
import RightToolbar from '@/components/chart/RightToolbar';
import BottomBar from '@/components/chart/BottomBar';
import ChartContainer from '@/components/chart/ChartContainer';
import TradeOrderPanel from '@/components/chart/TradeOrderPanel';
import { Timeframe } from '@/lib/chartData';

export default function Simulator() {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [replayMode, setReplayMode] = useState(false);
  const [lastPrice, setLastPrice] = useState(6500);
  const buyHandlerRef = useRef<((config: SLTPConfig) => void) | null>(null);
  const sellHandlerRef = useRef<((config: SLTPConfig) => void) | null>(null);
  const [draggedSlTicks, setDraggedSlTicks] = useState<number | null>(null);
  const [draggedTpTicks, setDraggedTpTicks] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#131722]">
      <TopBar
        onTradeClick={() => setTradeOpen(!tradeOpen)}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onReplayClick={() => setReplayMode(!replayMode)}
        replayMode={replayMode}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
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
        />
        <RightToolbar />
        {tradeOpen && (
          <TradeOrderPanel
            onClose={() => setTradeOpen(false)}
            lastPrice={lastPrice}
            onBuy={(config) => { buyHandlerRef.current?.(config); }}
            onSell={(config) => { sellHandlerRef.current?.(config); }}
            externalSlTicks={draggedSlTicks}
            externalTpTicks={draggedTpTicks}
          />
        )}
      </div>
      <BottomBar />
    </div>
  );
}
