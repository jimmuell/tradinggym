import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType } from 'lightweight-charts';
import { candlestickData, getSMAData, getEMAData, getBuySellSignals } from '@/lib/chartData';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ChartContainerProps {
  ohlcv: { open: number; high: number; low: number; close: number; volume: string };
}

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];

function CurrencyDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('USD');

  return (
    <div className="absolute top-0 right-0 z-20" style={{ width: 62 }}>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between bg-white border border-[#d1d4dc] px-2 py-1 text-[12px] text-[#131722] cursor-pointer hover:bg-[#f0f3fa]"
      >
        <span>{selected}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="#787b86"><path d="M0 0l4 5 4-5z"/></svg>
      </div>
      {open && (
        <div className="bg-white border border-[#d1d4dc] border-t-0 shadow-md max-h-[200px] overflow-y-auto">
          {currencies.map((c) => (
            <div
              key={c}
              onClick={() => { setSelected(c); setOpen(false); }}
              className={`px-2 py-1 text-[12px] cursor-pointer hover:bg-[#e8f0fe] ${c === selected ? 'bg-[#e8f0fe] font-semibold' : 'text-[#131722]'}`}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChartContainer({ ohlcv }: ChartContainerProps) {
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
        scaleMargins: { top: 0.1, bottom: 0.05 },
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

    const sma20 = chart.addLineSeries({
      color: '#4caf50',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20.setData(getSMAData(candlestickData, 20));

    const ema50 = chart.addLineSeries({
      color: '#2196f3',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema50.setData(getEMAData(candlestickData, 50));

    const markers = getBuySellSignals(candlestickData);
    candleSeries.setMarkers(markers);

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

  const change = ohlcv.close - ohlcv.open;
  const changePct = (change / ohlcv.open) * 100;

  return (
    <div className="relative flex-1 min-w-0 bg-white">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Chart overlay: OHLCV + Bid/Ask (top-left, on chart) */}
      <div className="absolute top-1 left-1 z-10 pointer-events-none">
        {/* Row 1: Ticker description + OHLCV */}
        <div className="flex items-center gap-1 text-[11px] text-[#787b86] flex-wrap">
          <span>🇺🇸</span>
          <span>Micro E-mini S&P 500 Index Futures (Jun 2026) · 5 · CME</span>
          <span className="ml-1">
            O<span className="text-[#131722] ml-0.5">{ohlcv.open.toFixed(2)}</span>
          </span>
          <span>
            H<span className="text-[#131722] ml-0.5">{ohlcv.high.toFixed(2)}</span>
          </span>
          <span>
            L<span className="text-[#131722] ml-0.5">{ohlcv.low.toFixed(2)}</span>
          </span>
          <span>
            C<span className="text-[#131722] ml-0.5">{ohlcv.close.toFixed(2)}</span>
          </span>
          <span className={change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
          <span>
            Vol<span className="text-[#131722] ml-0.5">{ohlcv.volume}</span>
          </span>
        </div>
        {/* Row 2: Bid/Ask boxes */}
        <div className="flex items-center gap-1 mt-1 pointer-events-auto">
          <div className="flex items-center bg-[#ef5350] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.50).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">SELL</span>
          </div>
          <div className="flex flex-col items-center text-[9px] text-[#787b86] leading-tight">
            <span>0.25</span>
            <span>3</span>
          </div>
          <div className="flex items-center bg-[#26a69a] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.25).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">BUY</span>
          </div>
        </div>
        {/* Row 3: ▼ 7 */}
        <div className="text-[10px] text-[#787b86] mt-0.5">▼ 7</div>
      </div>

      {/* USD currency dropdown — on top of the price axis */}
      <CurrencyDropdown />

      {/* TradingView logo watermark */}
      <div className="absolute bottom-12 left-4 text-[#e0e3eb] text-2xl font-bold select-none pointer-events-none">
        TV
      </div>
      {/* Zoom controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button onClick={() => handleZoom('out')} className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]">
          <Minus size={14} />
        </button>
        <button onClick={() => handleZoom('in')} className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]">
          <Plus size={14} />
        </button>
        <div className="w-1" />
        <button onClick={() => handleScroll('left')} className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => handleScroll('right')} className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]">
          <ChevronRight size={14} />
        </button>
        <button onClick={() => chartRef.current?.timeScale().fitContent()} className="w-7 h-7 flex items-center justify-center rounded bg-[#363a45] hover:bg-[#4a4e59] text-[#d1d4dc]">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
