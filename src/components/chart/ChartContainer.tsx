import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ColorType } from 'lightweight-charts';
import { candlestickData, getSMAData, getEMAData, getBuySellSignals } from '@/lib/chartData';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function ChartContainer() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    candleSeries.setData(candlestickData);

    // SMA 20
    const sma20 = chart.addLineSeries({
      color: '#26a69a',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20.setData(getSMAData(candlestickData, 20));

    // EMA 50
    const ema50 = chart.addLineSeries({
      color: '#42a5f5',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema50.setData(getEMAData(candlestickData, 50));

    // Buy/Sell markers
    const markers = getBuySellSignals(candlestickData);
    candleSeries.setMarkers(markers);

    // Current price line
    const lastCandle = candlestickData[candlestickData.length - 1];
    candleSeries.createPriceLine({
      price: lastCandle.close,
      color: '#ef5350',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'MESM2026',
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const barsCount = range.to - range.from;
    const center = (range.from + range.to) / 2;
    const factor = direction === 'in' ? 0.8 : 1.25;
    const newBars = barsCount * factor;
    timeScale.setVisibleLogicalRange({
      from: center - newBars / 2,
      to: center + newBars / 2,
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const shift = (range.to - range.from) * 0.2 * (direction === 'right' ? 1 : -1);
    timeScale.setVisibleLogicalRange({
      from: range.from + shift,
      to: range.to + shift,
    });
  };

  return (
    <div className="relative flex-1 bg-[#131722]">
      <div ref={chartContainerRef} className="w-full h-full" />
      {/* TradingView logo watermark */}
      <div className="absolute bottom-12 left-4 text-[#2a2e39] text-2xl font-bold select-none pointer-events-none">
        TV
      </div>
      {/* Zoom controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button
          onClick={() => handleZoom('out')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => handleZoom('in')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]"
        >
          <Plus size={14} />
        </button>
        <div className="w-1" />
        <button
          onClick={() => handleScroll('left')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => chartRef.current?.timeScale().fitContent()}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#787b86]"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
