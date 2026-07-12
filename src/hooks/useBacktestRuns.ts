import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ValidationStatus = 'pass' | 'caution' | 'fail' | 'inconclusive' | 'info';

export interface ValidationFinding {
  key: string;
  title: string;
  status: ValidationStatus | string;
  headline: string;
  detail: string;
  stat: number | null;
}

export interface ValidationRegimeStats {
  n_trades: number;
  expectancy: number;
  win_rate: number;
  net_profit: number;
}

export interface ValidationRegimeScheme {
  trade_counts: Record<string, number>;
  per_regime: Record<string, ValidationRegimeStats>;
}

export interface BacktestValidation {
  overall: ValidationStatus | string;
  summary: string;
  findings: ValidationFinding[];
  regimes: Record<string, ValidationRegimeScheme>;
  skipped: string[];
}

export interface BacktestRun {
  id: string;
  user_id: string;
  strategy_id: string | null;
  strategy_name: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  stop_loss_ticks: number;
  take_profit_ticks: number;
  max_trades_per_day: number;
  total_trades: number | null;
  wins: number | null;
  losses: number | null;
  net_pnl: number | null;
  win_rate: number | null;
  profit_factor: number | null;
  max_drawdown: number | null;
  avg_winner: number | null;
  avg_loser: number | null;
  status: 'pending' | 'running' | 'complete' | 'failed';
  created_at: string;
  strategy_config: Record<string, unknown> | null;
  results_detail: Record<string, unknown> | null;
  equity_curve: Array<{ timestamp: string; equity: number }> | null;
  ai_signal_code: string | null;
  signal_hash?: string | null;
  error_message: string | null;
  engine_version: string | null;
  execution_time_ms: number | null;
  estimated_runtime_ms?: number | null;
  direction: string | null;
  commission_pct: number | null;
  commission_mode?: string | null;
  commission_per_rt?: number | null;
  stop_loss_pct?: number | null;
  take_profit_pct?: number | null;
  stop_loss_points?: number | null;
  take_profit_points?: number | null;
  slippage_ticks?: number | null;
  qty_value?: number | null;
  validation?: BacktestValidation | null;
  validation_error?: string | null;
}

export interface NewBacktestRun {
  strategy_id: string | null;
  strategy_name: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  stop_loss_ticks: number;
  take_profit_ticks: number;
  max_trades_per_day: number;
  strategy_config?: Record<string, unknown>;
  direction?: string;
  commission_pct?: number;
  commission_mode?: string;
  commission_per_rt?: number;
  run_validation?: boolean;
  validation_iterations?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  stop_loss_points?: number;
  take_profit_points?: number;
  slippage_ticks?: number;
  qty_value?: number;
  estimated_runtime_ms?: number;
}

function createRealtimeNonce() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useBacktestRuns() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_runs', user?.id],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const runs = query.state.data as BacktestRun[] | undefined;
      const hasActive = runs?.some((r) => r.status === 'pending' || r.status === 'running');
      // Poll aggressively while a run is in-flight. Engine typically finishes in
      // ~3s, so 5s polling meant users watched a stale spinner for a full cycle
      // even in the happy path. Realtime is the primary path; this is fallback.
      return hasActive ? 2000 : false;
    },
    queryFn: async (): Promise<BacktestRun[]> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BacktestRun[];
    },
  });

  // Realtime: the polling fallback above missed completions in production
  // (users watched spinners for minutes while the row was already `complete`
  // in the DB). Subscribe to row updates for this user and invalidate on any
  // change so the UI reflects the terminal state within ms of the engine
  // callback landing.
  useEffect(() => {
    if (!user?.id) return;
    // Realtime is a *nice-to-have* on top of the 2s poll. If anything in this
    // setup throws — duplicate channel topic, transport failure, supabase-js
    // lifecycle quirk — it MUST NOT take the Backtesting page down. Wrap the
    // whole thing and let the polling fallback carry the feature.
    //
    // Unique channel topic per mount so React StrictMode's double-invoke, or
    // any remount, never lands on an already-subscribed channel and triggers
    // the "cannot add postgres_changes callbacks after subscribe()" error.
    // Keep the auth user id OUT of the topic: seeing a stable UUID in the
    // thrown topic masked this failure before, and the row filter below is the
    // only place the user id belongs.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const topic = `backtest_runs:client:${createRealtimeNonce()}`;
      const ch = supabase.channel(topic);
      // ALL .on() handlers must be registered BEFORE .subscribe(). Do not
      // chain .subscribe() into the same expression as .on() if a later
      // effect could ever touch this channel again — we create fresh
      // channels per mount instead.
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'backtest_runs', filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ['backtest_runs', user.id] });
        },
      );
      ch.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Fallback poll (refetchInterval above) keeps the UI live, but make
          // the degraded path explicit so Realtime cannot silently regress.
          // eslint-disable-next-line no-console
          console.warn('[realtime] backtest_runs subscription FAILED — falling back to poll', { status });
        }
      });
      channel = ch;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[realtime] backtest_runs subscription FAILED — falling back to poll', err);
    }
    return () => {
      if (!channel) return;
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
    };
  }, [user?.id, qc]);

  return { runs: data ?? [], isLoading };
}

export function useCreateBacktestRun() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewBacktestRun) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('backtest_runs')
        .insert({ ...input, user_id: user.id, status: 'pending' } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BacktestRun;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest_runs', user?.id] });
    },
  });
}

export function useDeleteBacktestRun() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('backtest_runs')
        .delete()
        .eq('id', runId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest_runs', user?.id] });
    },
  });
}

export function useCancelBacktestRun() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (runId?: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const query = supabase
        .from('backtest_runs')
        .update({
          status: 'failed',
          error_message: 'Canceled by user',
        } as never)
        .eq('user_id', user.id)
        .in('status', ['pending', 'running']);
      const { error } = runId ? await query.eq('id', runId) : await query;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest_runs', user?.id] });
    },
  });
}
