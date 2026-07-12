import { useEffect, useRef } from 'react';
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

const LIST_LIMIT = 25;
const TERMINAL_STATUSES = new Set(['complete', 'failed']);
const REALTIME_FAILURE_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);

type BacktestRealtimeSubscription = {
  channel: ReturnType<typeof supabase.channel>;
  refs: number;
  topic: string;
  warnedStatuses: Set<string>;
};

const activeBacktestRealtimeByUser = new Map<string, BacktestRealtimeSubscription>();

function createRealtimeNonce() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Reads the user's most recent backtest runs. Realtime is the primary delivery
 * path — on any UPDATE we apply payload.new directly to the react-query cache
 * (REPLICA IDENTITY FULL means the payload already contains the full row) so we
 * do NOT refetch after a realtime event.
 *
 * There is NO list-level polling here. The narrow single-run poll lives in
 * `useBacktestRunPoll` and only runs while a specific run is in flight.
 */
export function useBacktestRuns() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  // Track which runs we've already seen in a terminal state so we log the
  // delivery mechanism exactly once per run.
  const seenTerminalRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_runs', user?.id],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    queryFn: async (): Promise<BacktestRun[]> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      const runs = (data ?? []) as unknown as BacktestRun[];
      // Seed the terminal tracker so an initial page-load of already-complete
      // runs doesn't log spurious delivery messages.
      for (const r of runs) {
        if (TERMINAL_STATUSES.has(r.status)) seenTerminalRef.current.add(r.id);
      }
      return runs;
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    // Realtime is the primary path. Keep exactly ONE channel per signed-in user,
    // even if this hook is accidentally mounted twice by a parent/component path.
    let entry = activeBacktestRealtimeByUser.get(user.id);
    if (entry) {
      entry.refs += 1;
      return () => releaseBacktestRealtime(user.id, entry);
    }

    try {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
      const topic = `backtest_runs:client:${createRealtimeNonce()}`;
      const ch = supabase.channel(topic);
      entry = { channel: ch, refs: 1, topic, warnedStatuses: new Set() };
      activeBacktestRealtimeByUser.set(user.id, entry);

      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'backtest_runs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          applyRealtimePayload(qc, user.id, payload, seenTerminalRef.current);
        },
      );
      ch.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          // eslint-disable-next-line no-console
          console.debug('[realtime] backtest_runs subscription SUCCEEDED', { status, topic });
          return;
        }
        if (REALTIME_FAILURE_STATUSES.has(status) && entry && !entry.warnedStatuses.has(status)) {
          entry.warnedStatuses.add(status);
          // eslint-disable-next-line no-console
          console.warn(`[realtime] backtest_runs subscription FAILED (${status}) — falling back to poll`, {
            status,
            topic,
            error: describeRealtimeError(error),
            rawError: error,
          });
        }
      });
    } catch (err) {
      if (entry) activeBacktestRealtimeByUser.delete(user.id);
      // eslint-disable-next-line no-console
      console.warn('[realtime] backtest_runs subscription FAILED (SETUP_THROW) — falling back to poll', {
        status: 'SETUP_THROW',
        error: describeRealtimeError(err),
        rawError: err,
      });
    }
    return () => releaseBacktestRealtime(user.id, entry ?? null);
  }, [user?.id, session?.access_token, qc]);

  return { runs: data ?? [], isLoading };
}

function releaseBacktestRealtime(userId: string, entry: BacktestRealtimeSubscription | null) {
  if (!entry) return;
  const current = activeBacktestRealtimeByUser.get(userId);
  if (current !== entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  activeBacktestRealtimeByUser.delete(userId);
  try {
    supabase.removeChannel(entry.channel);
  } catch {
    /* noop */
  }
}

function describeRealtimeError(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') return { message: error };
  if (typeof error === 'object') {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }
  return error;
}

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

/**
 * Merge a realtime row into the react-query cache without a refetch.
 * Logs the delivery mechanism the first time a run reaches a terminal state.
 */
function applyRealtimePayload(
  qc: ReturnType<typeof useQueryClient>,
  userId: string,
  payload: RealtimePayload,
  seenTerminal: Set<string>,
) {
  const key = ['backtest_runs', userId];
  const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as unknown as BacktestRun | null;
  if (!row?.id) return;

  qc.setQueryData<BacktestRun[]>(key, (prev) => {
    const list = prev ?? [];
    if (payload.eventType === 'DELETE') {
      return list.filter((r) => r.id !== row.id);
    }
    const idx = list.findIndex((r) => r.id === row.id);
    if (idx === -1) {
      // INSERT for a run we haven't seen. Prepend and keep list length bounded.
      return [row, ...list].slice(0, LIST_LIMIT);
    }
    // UPDATE: replace in place. payload.new is the FULL row (REPLICA IDENTITY
    // FULL) so we do not need to merge with existing fields.
    const next = list.slice();
    next[idx] = { ...list[idx], ...row };
    return next;
  });

  if (TERMINAL_STATUSES.has(row.status) && !seenTerminal.has(row.id)) {
    seenTerminal.add(row.id);
    // eslint-disable-next-line no-console
    console.debug('[backtest] result delivered via realtime', row.id);
  }
}

/**
 * Narrow poll for a SINGLE active run. Selects only `id,status` (not the whole
 * list, not select=*). Backoff 2s → 4s → 8s. Stops the moment the run reaches a
 * terminal state. If realtime delivered first, this will observe the terminal
 * state on its next tick and stop; it will NOT log delivery because the
 * realtime handler already marked it seen.
 */
export function useBacktestRunPoll(runId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id || !runId) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    const BACKOFF_MS = [2000, 4000, 8000];

    const tick = async () => {
      if (cancelled) return;
      try {
        const { data, error } = await supabase
          .from('backtest_runs')
          .select('id,status')
          .eq('id', runId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        const status = (data as { status?: string } | null)?.status;
        if (status && TERMINAL_STATUSES.has(status)) {
          // Realtime handler marks runs as seen when it delivers. If this poll
          // reached the terminal state FIRST, log the fallback path so a silent
          // realtime failure is visible in the console.
          const cache = qc.getQueryData<BacktestRun[]>(['backtest_runs', user.id]) ?? [];
          const cached = cache.find((r) => r.id === runId);
          const alreadyTerminalInCache = cached && TERMINAL_STATUSES.has(cached.status);
          if (!alreadyTerminalInCache) {
            // eslint-disable-next-line no-console
            console.debug('[backtest] result delivered via poll fallback', runId);
            // Realtime didn't beat us — pull the full row so consumers get
            // results_detail/equity_curve/etc.
            qc.invalidateQueries({ queryKey: ['backtest_runs', user.id] });
          }
          return; // stop polling
        }
      } catch {
        // Swallow — next tick will retry, or the effect cleanup ends it.
      }
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      attempt += 1;
      timeout = setTimeout(tick, delay);
    };

    timeout = setTimeout(tick, BACKOFF_MS[0]);

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [runId, user?.id, qc]);
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
