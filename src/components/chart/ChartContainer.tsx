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
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#787b86',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#e1ecf2' },
        horzLines: { color: '#e1ecf2' },
      },
      rightPriceScale: {
        borderColor: '#e1ecf2',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: '#e1ecf2',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#9598a1', width: 1, style: 3, labelBackgroundColor: '#505050' },
        horzLine: { color: '#9598a1', width: 1, style: 3, labelBackgroundColor: '#505050' },
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

    // SMA 20 - green
    const sma20 = chart.addLineSeries({
      color: '#4caf50',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20.setData(getSMAData(candlestickData, 20));

    // EMA 50 - blue
    const ema50 = chart.addLineSeries({
      color: '#2196f3',
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
    <div className="relative flex-1 bg-white">
      <div ref={chartContainerRef} className="w-full h-full" />
      {/* TradingView logo watermark */}
      <div className="absolute bottom-12 left-4 text-[#e0e3eb] text-2xl font-bold select-none pointer-events-none">
        TV
      </div>
      {/* Zoom controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button
          onClick={() => handleZoom('out')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => handleZoom('in')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]"
        >
          <Plus size={14} />
        </button>
        <div className="w-1" />
        <button
          onClick={() => handleScroll('left')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => chartRef.current?.timeScale().fitContent()}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
