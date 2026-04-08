import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  LineStyle,
  ColorType,
  CandlestickData,
  Time,
  SeriesMarker,
  IPriceLine,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import { loadTimeframeData, getSMAData, getEMAData, Timeframe } from '@/lib/chartData';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import ReplayControls from './ReplayControls';

interface Position {
  id: string;
  side: 'long' | 'short';
  entryPrice: number;
  entryTime: Time;
  quantity: number;
  priceLine: IPriceLine;
  marker: SeriesMarker<Time>;
}

interface ChartContainerProps {
  timeframe: Timeframe;
  replayMode: boolean;
  onExitReplay: () => void;
  onPriceUpdate: (price: number) => void;
  onRegisterBuyHandler?: (handler: (() => void) | null) => void;
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

export default function ChartContainer({ timeframe, replayMode, onExitReplay, onPriceUpdate, onRegisterBuyHandler }: ChartContainerProps) {
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
  const [positions, setPositions] = useState<Position[]>([]);

  // Markers plugin ref — accumulates markers via createSeriesMarkers
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const markersArrayRef = useRef<SeriesMarker<Time>[]>([]);

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

    // v5.1: use chart.addSeries(CandlestickSeries, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });
    candleSeriesRef.current = candleSeries;

    // v5.1: use chart.addSeries(LineSeries, options)
    const sma = chart.addSeries(LineSeries, { color: '#4caf50', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    smaSeriesRef.current = sma;

    const ema = chart.addSeries(LineSeries, { color: '#2196f3', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    emaSeriesRef.current = ema;

    // v5.1: initialize markers plugin with createSeriesMarkers
    markersPluginRef.current = createSeriesMarkers(candleSeries, []);
    markersArrayRef.current = [];

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    // Crosshair move handler for OHLCV hover
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        const data = allDataRef.current;
        const slice = replayMode ? data.slice(0, replayIndex) : data;
        const last = slice[slice.length - 1];
        if (last) {
          setOhlcv({ open: last.open, high: last.high, low: last.low, close: last.close, volume: '—' });
        }
        return;
      }
      const candle = param.seriesData.get(candleSeries) as CandlestickData<Time> | undefined;
      if (candle) {
        setOhlcv({ open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: '—' });
      }
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      markersPluginRef.current = null;
    };
  }, []);

  // Save range before timeframe change
  const saveCurrentRange = useCallback(() => {
    const range = chartRef.current?.timeScale().getVisibleLogicalRange();
    if (range) savedRangeRef.current = { from: range.from, to: range.to };
  }, []);

  const setReplayEmptyView = useCallback(() => {
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: -5, to: 100 });
  }, []);

  // Load data when timeframe changes
  useEffect(() => {
    saveCurrentRange();
    let cancelled = false;
    loadTimeframeData(timeframe).then((data) => {
      if (cancelled || !candleSeriesRef.current) return;
      allDataRef.current = data;

      if (replayMode) {
        setReplayIndex(0);
        candleSeriesRef.current.setData([]);
        smaSeriesRef.current?.setData([]);
        emaSeriesRef.current?.setData([]);
        setReplayEmptyView();
        setOhlcv({ open: 0, high: 0, low: 0, close: 0, volume: '—' });
      } else {
        candleSeriesRef.current.setData(data);
        smaSeriesRef.current?.setData(getSMAData(data, 20));
        emaSeriesRef.current?.setData(getEMAData(data, 50));

        if (savedRangeRef.current) {
          chartRef.current?.timeScale().setVisibleLogicalRange(savedRangeRef.current);
        } else {
          const len = data.length;
          chartRef.current?.timeScale().setVisibleLogicalRange({ from: len - 100, to: len + 5 });
        }

        const last = data[data.length - 1];
        if (last) {
          setOhlcv({ open: last.open, high: last.high, low: last.low, close: last.close, volume: '—' });
          onPriceUpdate(last.close);
        }
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
      setReplayEmptyView();
      setOhlcv({ open: 0, high: 0, low: 0, close: 0, volume: '—' });
    } else {
      setIsPlaying(false);
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      candleSeriesRef.current.setData(data);
      smaSeriesRef.current?.setData(getSMAData(data, 20));
      emaSeriesRef.current?.setData(getEMAData(data, 50));
      const len = data.length;
      chartRef.current?.timeScale().setVisibleLogicalRange({ from: len - 100, to: len + 5 });
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
      setReplayEmptyView();
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
    chartRef.current?.timeScale().scrollToPosition(2, false);
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

  // Place a position (buy or sell) — uses v5.1 createSeriesMarkers + createPriceLine
  const placePosition = useCallback((side: 'long' | 'short') => {
    const data = allDataRef.current;
    if (!data.length || !candleSeriesRef.current) return;
    const currentData = replayMode ? data.slice(0, replayIndex) : data;
    const lastBar = currentData[currentData.length - 1];
    if (!lastBar) return;

    const entryPrice = side === 'long' ? ohlcv.close - 0.25 : ohlcv.close - 0.50;

    // Create marker
    const marker: SeriesMarker<Time> = {
      time: lastBar.time,
      position: side === 'long' ? 'belowBar' : 'aboveBar',
      color: side === 'long' ? '#2962ff' : '#f23645',
      shape: side === 'long' ? 'arrowUp' : 'arrowDown',
      text: `${side === 'long' ? 'BUY' : 'SELL'} @ ${entryPrice.toFixed(2)}`,
    };

    // Accumulate markers (never replace)
    markersArrayRef.current = [...markersArrayRef.current, marker].sort((a, b) => {
      if (typeof a.time === 'number' && typeof b.time === 'number') return a.time - b.time;
      return String(a.time) < String(b.time) ? -1 : 1;
    });
    markersPluginRef.current?.setMarkers(markersArrayRef.current);

    // Create price line using v5.1 API
    const priceLine = candleSeriesRef.current.createPriceLine({
      price: entryPrice,
      color: side === 'long' ? '#2962ff' : '#f23645',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `${side === 'long' ? 'Long Entry' : 'Short Entry'} ${1}`,
    });

    const pos: Position = {
      id: Date.now().toString(),
      side,
      entryPrice,
      entryTime: lastBar.time,
      quantity: 1,
      priceLine,
      marker,
    };
    setPositions((prev) => [...prev, pos]);
  }, [ohlcv.close, replayMode, replayIndex]);

  useEffect(() => {
    onRegisterBuyHandler?.(() => placePosition('long'));

    return () => {
      onRegisterBuyHandler?.(null);
    };
  }, [onRegisterBuyHandler, placePosition]);

  // Close a position — removes stored priceLine ref and marker
  const closePosition = useCallback((id: string) => {
    setPositions((prev) => {
      const pos = prev.find((p) => p.id === id);
      if (pos && candleSeriesRef.current) {
        // Remove the specific price line by stored reference (NEVER iterate all)
        candleSeriesRef.current.removePriceLine(pos.priceLine);

        // Remove marker from accumulated array and refresh
        markersArrayRef.current = markersArrayRef.current.filter((m) => m !== pos.marker);
        markersPluginRef.current?.setMarkers(markersArrayRef.current);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const change = ohlcv.close - ohlcv.open;
  const changePct = ohlcv.open ? (change / ohlcv.open) * 100 : 0;

  // Calculate P&L for each position
  const getPnL = (pos: Position) => {
    const diff = pos.side === 'long' ? ohlcv.close - pos.entryPrice : pos.entryPrice - ohlcv.close;
    return diff * pos.quantity * 5; // MES = $5 per point
  };

  return (
    <div className="relative flex-1 min-w-0 bg-white">
      <div ref={chartContainerRef} className="absolute inset-0" />

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
        <div className="flex items-center gap-2 text-[14px] text-[#787b86] flex-wrap">
          <span>🇺🇸</span>
          <span className="font-medium">Micro E-mini S&P 500 Index Futures (Jun 2026) · {timeframe} · CME</span>
          <span className="ml-1">O<span className="text-[#131722] font-medium ml-0.5">{ohlcv.open.toFixed(2)}</span></span>
          <span>H<span className="text-[#131722] font-medium ml-0.5">{ohlcv.high.toFixed(2)}</span></span>
          <span>L<span className="text-[#131722] font-medium ml-0.5">{ohlcv.low.toFixed(2)}</span></span>
          <span>C<span className="text-[#131722] font-medium ml-0.5">{ohlcv.close.toFixed(2)}</span></span>
          <span className={change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
          <span>Vol{ohlcv.volume}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 pointer-events-auto">
          <div
            onClick={() => placePosition('short')}
            className="flex flex-col items-center justify-center bg-[#f23645] text-white rounded-[6px] min-w-[90px] py-1.5 px-3 cursor-pointer hover:bg-[#d42f3d] active:scale-95 transition-all"
          >
            <span className="text-[14px] font-bold leading-tight tracking-tight">{(ohlcv.close - 0.50).toFixed(2)}</span>
            <span className="text-[9px] font-medium leading-tight opacity-90">SELL</span>
          </div>
          <div className="flex flex-col items-center justify-center text-[12px] text-[#787b86] leading-tight px-2 py-1.5 bg-[#f0f3fa] border border-[#d1d4dc] rounded-[6px] min-w-[36px]">
            <span>0.25</span><span>{positions.length}</span>
          </div>
          <div
            onClick={() => placePosition('long')}
            className="flex flex-col items-center justify-center bg-[#2962ff] text-white rounded-[6px] min-w-[90px] py-1.5 px-3 cursor-pointer hover:bg-[#1e53e5] active:scale-95 transition-all"
          >
            <span className="text-[14px] font-bold leading-tight tracking-tight">{(ohlcv.close - 0.25).toFixed(2)}</span>
            <span className="text-[9px] font-medium leading-tight opacity-90">BUY</span>
          </div>
        </div>
        <div className="text-[12px] text-[#787b86] mt-1">▼ {positions.length}</div>
      </div>

      {/* Active positions overlay */}
      {positions.length > 0 && (
        <div className="absolute top-1 right-[70px] z-20 flex flex-col gap-1 pointer-events-auto">
          {positions.map((pos) => {
            const pnl = getPnL(pos);
            const isProfit = pnl >= 0;
            return (
              <div
                key={pos.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-white text-[12px] shadow-md ${
                  pos.side === 'long' ? 'bg-[#2962ff]' : 'bg-[#f23645]'
                }`}
              >
                <span className="font-semibold">{pos.side === 'long' ? '▲ BUY' : '▼ SELL'}</span>
                <span className="opacity-80">@ {pos.entryPrice.toFixed(2)}</span>
                <span className={`font-bold ${isProfit ? 'text-[#a5f3c4]' : 'text-[#fecaca]'}`}>
                  {isProfit ? '+' : ''}{pnl.toFixed(2)} USD
                </span>
                <button
                  onClick={() => closePosition(pos.id)}
                  className="ml-1 hover:bg-white/20 rounded p-0.5"
                  title="Close position"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

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
