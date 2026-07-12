import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fallback constants — used ONLY until enough real runs exist to calibrate.
const FALLBACK_MS_PER_DAY = 400;
const FALLBACK_OVERHEAD_MS = 1500;
const MIN_ESTIMATE_MS = 1_500;
const MIN_SAMPLES_TO_CALIBRATE = 3;

export interface RuntimeModel {
  estimateMs: (days: number) => number;
  isCalibrated: boolean;
  sampleSize: number;
}

type Point = { days: number; ms: number };

function daysBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Robust intercept + slope model.
 *
 * Real shape has BOTH a fixed engine overhead and a per-day cost:
 *   5d ≈ 2.8s, 30d ≈ 4.2s, 365d ≈ 69.6s → ~2s fixed + ~0.19s/day.
 *
 * A pure median(ms/day) model overshoots long runs 3x+ because it assumes
 * zero fixed cost. A naive linear regression breaks when every sample is the
 * same length (denominator collapses).
 *
 * Strategy:
 *   1. If sample spans ≥2 clearly-different range-lengths (max/min ≥ 1.5) and
 *      has ≥3 points → least-squares fit (intercept + slope). Clamp intercept
 *      to [0, 10s] and slope to [0.02, 2.0] s/day so a bad fit can't produce
 *      absurd numbers.
 *   2. Else → fall back to sane constants (FALLBACK_OVERHEAD_MS + FALLBACK_MS_PER_DAY).
 *      Do NOT use median(ms/day) alone — it's what caused the 4m 15s overshoot.
 */
function fitLinear(points: Point[]): { intercept: number; slope: number } | null {
  const valid = points.filter((p) => p.days > 0 && p.ms > 0);
  if (valid.length < MIN_SAMPLES_TO_CALIBRATE) return null;
  const days = valid.map((p) => p.days);
  const minD = Math.min(...days);
  const maxD = Math.max(...days);
  if (maxD / minD < 1.5) return null; // degenerate — all same length

  const n = valid.length;
  const sumX = valid.reduce((s, p) => s + p.days, 0);
  const sumY = valid.reduce((s, p) => s + p.ms, 0);
  const sumXY = valid.reduce((s, p) => s + p.days * p.ms, 0);
  const sumXX = valid.reduce((s, p) => s + p.days * p.days, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom <= 0) return null;

  let slope = (n * sumXY - sumX * sumY) / denom;
  let intercept = (sumY - slope * sumX) / n;

  // Clamp to sanity range so a single outlier can't produce absurd fits.
  slope = Math.max(20, Math.min(2000, slope)); // 0.02s/day .. 2s/day
  intercept = Math.max(0, Math.min(10_000, intercept));
  return { intercept, slope };
}

function estimateFromPoints(points: Point[], days: number): number | null {
  const fit = fitLinear(points);
  if (!fit) return null;
  return Math.max(MIN_ESTIMATE_MS, Math.round(fit.intercept + fit.slope * Math.max(1, days)));
}


export function useBacktestRuntimeEstimate(): RuntimeModel {
  const { data } = useQuery({
    queryKey: ['backtest-runtime-calibration'],
    staleTime: 60_000,
    queryFn: async (): Promise<Point[]> => {
      // Fetch a small pool of recent completed runs, then keep ONLY those whose
      // engine_version matches the newest completed run's engine_version.
      // Mixing samples across engine versions (e.g. 25.18.1 vs 25.19.0) poisons
      // the fit whenever engine speed changes — a 3s run gets a 9s estimate
      // because slow-engine points dominate. Filtering to the current version
      // makes an engine speedup automatically reset the model.
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('execution_time_ms, start_date, end_date, status, engine_version, created_at')
        .eq('status', 'complete')
        .not('execution_time_ms', 'is', null)
        .not('engine_version', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data ?? [];
      const currentVersion = rows[0]?.engine_version as string | undefined;
      if (!currentVersion) return [];
      return rows
        .filter((r) => r.engine_version === currentVersion && r.execution_time_ms && r.start_date && r.end_date)
        .slice(0, 25)
        .map((r) => ({
          days: daysBetween(r.start_date as string, r.end_date as string),
          ms: r.execution_time_ms as number,
        }));
    },
  });


  const points = data ?? [];
  const calibrated = points.length >= MIN_SAMPLES_TO_CALIBRATE;

  const estimateMs = (days: number): number => {
    const d = Math.max(1, days);
    const fromData = estimateFromPoints(points, d);
    if (fromData != null) return fromData;
    return Math.max(MIN_ESTIMATE_MS, Math.round(FALLBACK_OVERHEAD_MS + FALLBACK_MS_PER_DAY * d));
  };

  return { estimateMs, isCalibrated: calibrated, sampleSize: points.length };
}

export function daysBetweenDates(startISO: string, endISO: string): number {
  return daysBetween(startISO, endISO);
}
