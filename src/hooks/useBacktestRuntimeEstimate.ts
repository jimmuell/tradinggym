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
 * Robust estimator: median(ms/day) across recent runs, times requested days.
 * A naive linear regression breaks when the sample is dominated by same-length
 * runs (denom collapses → slope rejected → the constant fallback kicks in and
 * over-estimates a 3s run at 12s+). Median-per-day is scale-invariant and
 * insensitive to a single long-range outlier.
 */
function estimateFromPoints(points: Point[], days: number): number | null {
  if (points.length < MIN_SAMPLES_TO_CALIBRATE) return null;
  const perDay = points
    .filter((p) => p.days > 0 && p.ms > 0)
    .map((p) => p.ms / p.days);
  const m = median(perDay);
  if (m == null || !isFinite(m) || m <= 0) return null;
  return Math.max(MIN_ESTIMATE_MS, Math.round(m * Math.max(1, days)));
}

export function useBacktestRuntimeEstimate(): RuntimeModel {
  const { data } = useQuery({
    queryKey: ['backtest-runtime-calibration'],
    staleTime: 60_000,
    queryFn: async (): Promise<Point[]> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('execution_time_ms, start_date, end_date, status')
        .eq('status', 'complete')
        .not('execution_time_ms', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? [])
        .filter((r) => r.execution_time_ms && r.start_date && r.end_date)
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
