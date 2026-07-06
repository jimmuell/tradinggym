import { useEffect, useRef, useState } from 'react';
import { LineStyle, type IChartApi, type IPriceLine, type ISeriesApi, type Time } from 'lightweight-charts';
import type {
  Annotation,
  AnnotationColor,
  PlaybackPhase,
  PlaybackScenario,
  PriceLineAnnotation,
} from '@/lib/playbackTypes';

interface Props {
  chartApi: IChartApi | null;
  seriesApi: ISeriesApi<'Candlestick'> | null;
  scenario: PlaybackScenario;
  /** Annotations whose phase has been reached are visible. */
  currentPhase: PlaybackPhase;
  /** Bar count currently rendered on the chart. */
  visibleBarCount: number;
}

const COLOR_MAP: Record<AnnotationColor, { stroke: string; fill: string; text: string }> = {
  amber: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  blue: { stroke: '#2962ff', fill: 'rgba(41,98,255,0.12)', text: '#2962ff' },
  red: { stroke: '#ef5350', fill: 'rgba(239,83,80,0.12)', text: '#ef5350' },
  green: { stroke: '#26a69a', fill: 'rgba(38,166,154,0.12)', text: '#26a69a' },
  purple: { stroke: '#a855f7', fill: 'rgba(168,85,247,0.12)', text: '#a855f7' },
};

const PHASE_ORDER: PlaybackPhase[] = ['context', 'setup', 'confirmation', 'entry', 'exit', 'complete'];

function isOrbHigh(a: PriceLineAnnotation) {
  return a.label.trim().toLowerCase() === 'orb high';
}

function isOrbLow(a: PriceLineAnnotation) {
  return a.label.trim().toLowerCase() === 'orb low';
}

function isOrbPriceLine(a: PriceLineAnnotation) {
  return isOrbHigh(a) || isOrbLow(a);
}

function effectivePriceLineColor(a: PriceLineAnnotation): AnnotationColor {
  if (isOrbHigh(a)) return 'green';
  if (isOrbLow(a)) return 'red';
  return a.color;
}

function priceLineKey(a: PriceLineAnnotation) {
  return `${a.phase}|${a.label}|${a.price}|${a.color}`;
}

function isPhaseReached(annotationPhase: PlaybackPhase, currentPhase: PlaybackPhase) {
  return PHASE_ORDER.indexOf(annotationPhase) <= PHASE_ORDER.indexOf(currentPhase);
}

export default function AnnotationLayer({
  chartApi,
  seriesApi,
  scenario,
  currentPhase,
  visibleBarCount,
}: Props) {
  // tick state to force re-render when chart pans/zooms or price scale changes
  const [, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());

  // Continuous rAF tick so overlays recompute price->coordinate every frame,
  // keeping box/arrow/label annotations aligned during price-axis drag/zoom.
  useEffect(() => {
    let mounted = true;
    let raf = 0;
    const loop = () => {
      if (!mounted) return;
      setTick((t) => (t + 1) % 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!chartApi) return;
    const handler = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setTick((t) => (t + 1) % 1000);
      });
    };
    chartApi.timeScale().subscribeVisibleLogicalRangeChange(handler);
    chartApi.timeScale().subscribeSizeChange(handler);
    return () => {
      try {
        chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
        chartApi.timeScale().unsubscribeSizeChange(handler);
      } catch {
        /* chart may already be removed */
      }
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [chartApi]);

  // Native price lines for horizontal priceLine annotations — always track the price scale.
  useEffect(() => {
    if (!seriesApi) return;
    const desired = new Map<string, PriceLineAnnotation>();
    for (const a of scenario.annotations ?? []) {
      if (a.type !== 'priceLine') continue;
      if (!isPhaseReached(a.phase, currentPhase)) continue;
      desired.set(priceLineKey(a), a);
    }
    // Remove stale
    for (const [key, line] of priceLinesRef.current) {
      if (!desired.has(key)) {
        try {
          seriesApi.removePriceLine(line);
        } catch {
          /* ignore */
        }
        priceLinesRef.current.delete(key);
      }
    }
    // Add new
    for (const [key, a] of desired) {
      if (priceLinesRef.current.has(key)) continue;
      const color = effectivePriceLineColor(a);
      const c = COLOR_MAP[color];
      const isOrb = isOrbPriceLine(a);
      try {
        const line = seriesApi.createPriceLine({
          price: a.price,
          color: c.stroke,
          lineStyle: LineStyle.Dashed,
          lineWidth: 1,
          axisLabelVisible: !isOrb,
          title: isOrb ? undefined : a.label,
        });
        priceLinesRef.current.set(key, line);
      } catch {
        /* series may be gone */
      }
    }
  }, [seriesApi, scenario, currentPhase]);

  // Clean up native price lines on unmount / scenario change
  useEffect(() => {
    return () => {
      if (!seriesApi) return;
      for (const line of priceLinesRef.current.values()) {
        try {
          seriesApi.removePriceLine(line);
        } catch {
          /* ignore */
        }
      }
      priceLinesRef.current.clear();
    };
  }, [seriesApi, scenario]);

  // Force re-render when bar count or phase changes
  useEffect(() => {
    setTick((t) => (t + 1) % 1000);
  }, [visibleBarCount, currentPhase]);

  if (!chartApi || !seriesApi) return null;

  const candles = scenario.ohlcv_data;

  const barToTime = (barIdx: number): Time | null => {
    const c = candles[Math.max(0, Math.min(barIdx, candles.length - 1))];
    return c ? (c.time as Time) : null;
  };

  const barToX = (barIdx: number): number | null => {
    const t = barToTime(barIdx);
    if (t == null) return null;
    const x = chartApi.timeScale().timeToCoordinate(t);
    return x == null ? null : x;
  };

  const priceToY = (price: number): number | null => {
    const y = seriesApi.priceToCoordinate(price);
    return y == null ? null : y;
  };

  // priceLine annotations are drawn natively by the chart; skip them here.
  const visibleAnnotations = (scenario.annotations ?? []).filter(
    (a) => a.type !== 'priceLine' && isPhaseReached(a.phase, currentPhase),
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {visibleAnnotations.map((a, i) => renderAnnotation(a, i, { barToX, priceToY }))}
    </div>
  );
}

interface RenderCtx {
  barToX: (barIdx: number) => number | null;
  priceToY: (price: number) => number | null;
}

function renderAnnotation(a: Annotation, key: number, ctx: RenderCtx) {
  switch (a.type) {
    case 'box': {
      const x1 = ctx.barToX(a.fromBar);
      const x2 = ctx.barToX(a.toBar);
      const yTop = ctx.priceToY(a.toPrice);
      const yBot = ctx.priceToY(a.fromPrice);
      if (x1 == null || x2 == null || yTop == null || yBot == null) return null;
      const c = COLOR_MAP[a.color];
      const left = Math.min(x1, x2);
      const width = Math.abs(x2 - x1);
      const top = Math.min(yTop, yBot);
      const height = Math.abs(yBot - yTop);
      return (
        <div
          key={key}
          className="absolute rounded-sm border-2 transition-all duration-300 animate-fade-in"
          style={{
            left,
            top,
            width,
            height,
            borderColor: c.stroke,
            backgroundColor: c.fill,
          }}
        >
          {a.label && (
            <span
              className="absolute -top-5 left-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: c.stroke, color: '#fff' }}
            >
              {a.label}
            </span>
          )}
        </div>
      );
    }
    case 'arrow': {
      const x = ctx.barToX(a.bar);
      const y = ctx.priceToY(a.price);
      if (x == null || y == null) return null;
      const c = COLOR_MAP[a.color];
      const isUp = a.direction === 'up';
      // Place arrow 30px below or above the price
      const arrowY = isUp ? y + 28 : y - 28;
      return (
        <div
          key={key}
          className="absolute animate-fade-in"
          style={{ left: x - 10, top: arrowY - 10, width: 20, height: 20 }}
        >
          <div
            className="w-0 h-0 mx-auto animate-pulse"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              ...(isUp
                ? { borderBottom: `12px solid ${c.stroke}` }
                : { borderTop: `12px solid ${c.stroke}` }),
            }}
          />
          {a.label && (
            <div
              className="text-[10px] font-semibold mt-0.5 text-center whitespace-nowrap px-1 rounded"
              style={{ color: c.text }}
            >
              {a.label}
            </div>
          )}
        </div>
      );
    }
    case 'priceLine': {
      const y = ctx.priceToY(a.price);
      if (y == null) return null;
      const c = COLOR_MAP[a.color];
      return (
        <div
          key={key}
          className="absolute left-0 right-0 animate-fade-in"
          style={{ top: y, height: 0, borderTop: `1px dashed ${c.stroke}` }}
        >
          <span
            className="absolute right-16 -top-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: c.stroke, color: '#fff' }}
          >
            {a.label}
          </span>
        </div>
      );
    }
    case 'label': {
      const x = ctx.barToX(a.bar);
      const y = ctx.priceToY(a.price);
      if (x == null || y == null) return null;
      const c = COLOR_MAP[a.color];
      return (
        <div
          key={key}
          className="absolute text-[11px] font-medium px-1.5 py-0.5 rounded shadow animate-fade-in"
          style={{ left: x, top: y - 8, backgroundColor: c.stroke, color: '#fff' }}
        >
          {a.text}
        </div>
      );
    }
    case 'tooltip':
      // tooltips render in PlaybackOverlay so they appear in a known location
      return null;
  }
}
