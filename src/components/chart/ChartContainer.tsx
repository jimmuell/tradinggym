import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CandlestickData, Time } from 'lightweight-charts';
import { loadTimeframeData, getSMAData, getEMAData, Timeframe } from '@/lib/chartData';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import ReplayControls from './ReplayControls';

interface ChartContainerProps {
  timeframe: Timeframe;
  replayMode: boolean;
  onExitReplay: () => void;
  onPriceUpdate: (price: number) => void;
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

export default function ChartContainer({ timeframe, replayMode, onExitReplay, onPriceUpdate }: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const allDataRef = useRef<CandlestickData<Time>[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);
  const savedRangeRef = useRef<{ from: number; to: number } | null>(null);

  const [ohlcv, setOhlcv] = useState({ open: 0, high: 0, low: 0, close: 0, volume: '0' });

  // Create chart once
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
        barSpacing: 10,
        minBarSpacing: 2,
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
    candleSeriesRef.current = candleSeries;

    const sma = chart.addLineSeries({ color: '#4caf50', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    smaSeriesRef.current = sma;

    const ema = chart.addLineSeries({ color: '#2196f3', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    emaSeriesRef.current = ema;

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
      chartRef.current = null;
    };
  }, []);

  // Load data when timeframe changes
  useEffect(() => {
    let cancelled = false;
    loadTimeframeData(timeframe).then((data) => {
      if (cancelled || !candleSeriesRef.current) return;
      allDataRef.current = data;

      if (replayMode) {
        setReplayIndex(0);
        candleSeriesRef.current.setData([]);
        smaSeriesRef.current?.setData([]);
        emaSeriesRef.current?.setData([]);
      } else {
        candleSeriesRef.current.setData(data);
        smaSeriesRef.current?.setData(getSMAData(data, 20));
        emaSeriesRef.current?.setData(getEMAData(data, 50));
      }

      chartRef.current?.timeScale().fitContent();

      if (!replayMode) {
        const last = data[data.length - 1];
        if (last) {
          setOhlcv({ open: last.open, high: last.high, low: last.low, close: last.close, volume: '—' });
          onPriceUpdate(last.close);
        }
      } else {
        setOhlcv({ open: 0, high: 0, low: 0, close: 0, volume: '—' });
      }
    });
    return () => { cancelled = true; };
  }, [timeframe]);

  // Handle replay mode toggle
  useEffect(() => {
    const data = allDataRef.current;
    if (!data.length || !candleSeriesRef.current) return;

    if (replayMode) {
      setReplayIndex(0);
      setIsPlaying(false);
      candleSeriesRef.current.setData([]);
      smaSeriesRef.current?.setData([]);
      emaSeriesRef.current?.setData([]);
      setOhlcv({ open: 0, high: 0, low: 0, close: 0, volume: '—' });
    } else {
      setIsPlaying(false);
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      candleSeriesRef.current.setData(data);
      smaSeriesRef.current?.setData(getSMAData(data, 20));
      emaSeriesRef.current?.setData(getEMAData(data, 50));
      chartRef.current?.timeScale().fitContent();
      const last = data[data.length - 1];
      if (last) {
        setOhlcv({ open: last.open, high: last.high, low: last.low, close: last.close, volume: '—' });
        onPriceUpdate(last.close);
      }
    }
  }, [replayMode]);

  const updateReplayTo = useCallback((newIdx: number) => {
    const data = allDataRef.current;
    if (newIdx < 0 || newIdx > data.length || !candleSeriesRef.current) return;
    if (newIdx === 0) {
      setReplayIndex(0);
      setIsPlaying(false);
      candleSeriesRef.current.setData([]);
      smaSeriesRef.current?.setData([]);
      emaSeriesRef.current?.setData([]);
      setOhlcv({ open: 0, high: 0, low: 0, close: 0, volume: '—' });
      return;
    }
    setReplayIndex(newIdx);
    const slice = data.slice(0, newIdx);
    candleSeriesRef.current.setData(slice);
    smaSeriesRef.current?.setData(getSMAData(slice, 20));
    emaSeriesRef.current?.setData(getEMAData(slice, 50));
    const last = slice[slice.length - 1];
    if (last) {
      setOhlcv({ open: last.open, high: last.high, low: last.low, close: last.close, volume: '—' });
      onPriceUpdate(last.close);
    }
  }, [onPriceUpdate]);

  // Play interval
  useEffect(() => {
    if (isPlaying && replayMode) {
      const speed = timeframe === '1m' ? 100 : timeframe === '5m' ? 200 : 400;
      playIntervalRef.current = window.setInterval(() => {
        setReplayIndex((prev) => {
          const next = prev + 1;
          if (next > allDataRef.current.length) {
            setIsPlaying(false);
            return prev;
          }
          updateReplayTo(next);
          return next;
        });
      }, speed);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, replayMode, timeframe, updateReplayTo]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const barsCount = range.to - range.from;
    const center = (range.from + range.to) / 2;
    const factor = direction === 'in' ? 0.8 : 1.25;
    const newBars = barsCount * factor;
    timeScale.setVisibleLogicalRange({ from: center - newBars / 2, to: center + newBars / 2 });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const shift = (range.to - range.from) * 0.2 * (direction === 'right' ? 1 : -1);
    timeScale.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
  };

  const change = ohlcv.close - ohlcv.open;
  const changePct = ohlcv.open ? (change / ohlcv.open) * 100 : 0;

  return (
    <div className="relative flex-1 min-w-0 bg-white">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Replay controls */}
      {replayMode && (
        <ReplayControls
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onStepBack={() => updateReplayTo(replayIndex - 1)}
          onStepForward={() => updateReplayTo(replayIndex + 1)}
          onReset={() => updateReplayTo(0)}
          onExit={() => { setIsPlaying(false); onExitReplay(); }}
          currentBar={replayIndex}
          totalBars={allDataRef.current.length}
        />
      )}

      {/* OHLCV overlay */}
      <div className="absolute top-1 left-1 z-10 pointer-events-none">
        <div className="flex items-center gap-1 text-[11px] text-[#787b86] flex-wrap">
          <span>🇺🇸</span>
          <span>E-mini S&P 500 Futures · {timeframe} · CME</span>
          <span className="ml-1">O<span className="text-[#131722] ml-0.5">{ohlcv.open.toFixed(2)}</span></span>
          <span>H<span className="text-[#131722] ml-0.5">{ohlcv.high.toFixed(2)}</span></span>
          <span>L<span className="text-[#131722] ml-0.5">{ohlcv.low.toFixed(2)}</span></span>
          <span>C<span className="text-[#131722] ml-0.5">{ohlcv.close.toFixed(2)}</span></span>
          <span className={change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 pointer-events-auto">
          <div className="flex items-center bg-[#ef5350] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.50).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">SELL</span>
          </div>
          <div className="flex flex-col items-center text-[9px] text-[#787b86] leading-tight">
            <span>0.25</span><span>3</span>
          </div>
          <div className="flex items-center bg-[#26a69a] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.25).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">BUY</span>
          </div>
        </div>
        <div className="text-[10px] text-[#787b86] mt-0.5">▼ 7</div>
      </div>

      <CurrencyDropdown />

      <div className="absolute bottom-12 left-4 text-[#e0e3eb] text-2xl font-bold select-none pointer-events-none">TV</div>

      {/* Zoom/scroll controls */}
      <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
        <button onClick={() => handleZoom('out')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] shadow-md"><Minus size={16} /></button>
        <button onClick={() => handleZoom('in')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] shadow-md"><Plus size={16} /></button>
        <div className="w-1.5" />
        <button onClick={() => handleScroll('left')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] shadow-md"><ChevronLeft size={16} /></button>
        <button onClick={() => handleScroll('right')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] shadow-md"><ChevronRight size={16} /></button>
        <button onClick={() => chartRef.current?.timeScale().fitContent()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] shadow-md"><RotateCcw size={16} /></button>
      </div>
    </div>
  );
}
