import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fallback constants — used ONLY until enough real runs exist to calibrate.
const FALLBACK_INTERCEPT_MS = 12_000;
const FALLBACK_MS_PER_DAY = 9;
const MIN_ESTIMATE_MS = 3_000;
const MIN_SAMPLES_TO_CALIBRATE = 4;

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

function fitLinear(points: Point[]): { intercept: number; slope: number } | null {
  const n = points.length;
  if (n < MIN_SAMPLES_TO_CALIBRATE) return null;
  const sx = points.reduce((a, p) => a + p.days, 0);
  const sy = points.reduce((a, p) => a + p.ms, 0);
  const sxx = points.reduce((a, p) => a + p.days * p.days, 0);
  const sxy = points.reduce((a, p) => a + p.days * p.ms, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  if (slope <= 0 || intercept < 0) return null;
  return { intercept, slope };
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
  const fit = fitLinear(points);

  const estimateMs = (days: number): number => {
    const d = Math.max(1, days);
    const ms = fit
      ? fit.intercept + fit.slope * d
      : FALLBACK_INTERCEPT_MS + FALLBACK_MS_PER_DAY * d;
    return Math.max(MIN_ESTIMATE_MS, Math.round(ms));
  };

  return { estimateMs, isCalibrated: !!fit, sampleSize: points.length };
}

export function daysBetweenDates(startISO: string, endISO: string): number {
  return daysBetween(startISO, endISO);
}
