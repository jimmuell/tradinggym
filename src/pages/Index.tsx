import { useMemo } from 'react';
import TopBar from '@/components/chart/TopBar';
import LeftToolbar from '@/components/chart/LeftToolbar';
import RightToolbar from '@/components/chart/RightToolbar';
import BottomBar from '@/components/chart/BottomBar';
import ChartContainer from '@/components/chart/ChartContainer';
import { candlestickData } from '@/lib/chartData';

export default function Index() {
  const lastCandle = useMemo(() => {
    const c = candlestickData[candlestickData.length - 1];
    return {
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: '4.53K',
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#131722]">
      <TopBar ohlcv={lastCandle} />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        <ChartContainer />
        <RightToolbar />
      </div>
      <BottomBar />
    </div>
  );
}
