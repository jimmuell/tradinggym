import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
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

// Explicit column list for the LIST query. `results_detail` is the trade-by-trade
// JSONB — potentially huge — and is fetched lazily via `useBacktestRun(id)` only
// for the single run currently being displayed. NEVER add `*` here.
const LIST_COLUMNS = [
  'id',
  'user_id',
  'strategy_id',
  'strategy_name',
  'timeframe',
  'start_date',
  'end_date',
  'initial_balance',
  'stop_loss_ticks',
  'take_profit_ticks',
  'max_trades_per_day',
  'total_trades',
  'wins',
  'losses',
  'net_pnl',
  'win_rate',
  'profit_factor',
  'max_drawdown',
  'avg_winner',
  'avg_loser',
  'status',
  'created_at',
  'strategy_config',
  'ai_signal_code',
  'signal_hash',
  'error_message',
  'engine_version',
  'execution_time_ms',
  'estimated_runtime_ms',
  'direction',
  'commission_pct',
  'commission_mode',
  'commission_per_rt',
  'stop_loss_pct',
  'take_profit_pct',
  'stop_loss_points',
  'take_profit_points',
  'slippage_ticks',
  'qty_value',
  'validation',
  'validation_error',
].join(',');

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
 * Drop the large array/JSONB columns before caching a row in the LIST cache.
 * The list only needs summary/KPI columns — trade-by-trade `results_detail`
 * and the full `equity_curve` array are loaded lazily via `useBacktestRun(id)`
 * for the run currently being viewed.
 */
function stripLarge(row: BacktestRun): BacktestRun {
  if (!row) return row;
  if (row.results_detail == null && row.equity_curve == null) return row;
  return { ...row, results_detail: null, equity_curve: null };
}

/**
 * Reads the user's most recent backtest runs (SLIM columns only — no
 * results_detail). Realtime is the primary delivery path — on any INSERT/UPDATE
 * we apply payload.new directly to the react-query cache (REPLICA IDENTITY FULL
 * means the payload already carries the full row) so we do NOT refetch after a
 * realtime event, and we do NOT invalidate on mutations.
 *
 * There is NO list-level polling here. The narrow single-run poll lives in
 * `useBacktestRunPoll` and only runs while a specific run is in flight.
 */
export function useBacktestRuns() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const seenTerminalRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_runs', user?.id],
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<BacktestRun[]> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select(LIST_COLUMNS)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      const runs = (data ?? []) as unknown as BacktestRun[];
      for (const r of runs) {
        if (TERMINAL_STATUSES.has(r.status)) seenTerminalRef.current.add(r.id);
      }
      return runs;
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    if (session?.access_token) {
      supabase.realtime.setAuth(session.access_token);
    }
    let entry = activeBacktestRealtimeByUser.get(user.id);
    if (entry) {
      entry.refs += 1;
      return () => releaseBacktestRealtime(user.id, entry);
    }

    try {
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
          console.debug('[realtime] backtest_runs subscription SUCCEEDED', { status, topic });
          return;
        }
        if (REALTIME_FAILURE_STATUSES.has(status) && entry && !entry.warnedStatuses.has(status)) {
          entry.warnedStatuses.add(status);
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
    return { name: error.name, message: error.message, stack: error.stack };
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
 * - Updates the LIST cache with a slim copy (no results_detail).
 * - Updates the single-run cache (`['backtest_run', id]`) with the FULL row,
 *   since REPLICA IDENTITY FULL delivers every column including results_detail.
 */
function applyRealtimePayload(
  qc: QueryClient,
  userId: string,
  payload: RealtimePayload,
  seenTerminal: Set<string>,
) {
  const listKey = ['backtest_runs', userId];
  const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as unknown as BacktestRun | null;
  if (!row?.id) return;

  qc.setQueryData<BacktestRun[]>(listKey, (prev) => {
    const list = prev ?? [];
    if (payload.eventType === 'DELETE') {
      return list.filter((r) => r.id !== row.id);
    }
    const slim = stripLarge(row);
    const idx = list.findIndex((r) => r.id === row.id);
    if (idx === -1) {
      return [slim, ...list].slice(0, LIST_LIMIT);
    }
    const next = list.slice();
    next[idx] = { ...list[idx], ...slim };
    return next;
  });

  // Keep the single-run cache fresh with the FULL row from the realtime payload.
  const singleKey = ['backtest_run', row.id];
  if (payload.eventType === 'DELETE') {
    qc.removeQueries({ queryKey: singleKey });
  } else if (qc.getQueryData(singleKey) !== undefined || TERMINAL_STATUSES.has(row.status)) {
    qc.setQueryData<BacktestRun>(singleKey, (prev) => ({ ...(prev ?? {} as BacktestRun), ...row }));
  }

  if (TERMINAL_STATUSES.has(row.status) && !seenTerminal.has(row.id)) {
    seenTerminal.add(row.id);
    console.debug('[backtest] result delivered via realtime', row.id);
  }
}

/**
 * Fetches the FULL single run (select=*) lazily. Bounded to a single row via
 * `.eq('id', id)`. Realtime UPDATE events for this id merge into this cache
 * with no extra network call.
 */
export function useBacktestRun(runId: string | null | undefined) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_run', runId],
    enabled: !!user?.id && !!runId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<BacktestRun | null> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('*')
        .eq('id', runId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as BacktestRun) ?? null;
    },
  });

  return { run: data ?? null, isLoading };
}

/**
 * Narrow poll for a SINGLE active run. Selects only `id,status`. Backoff
 * 2s → 4s → 8s. Stops the moment the run reaches a terminal state. If realtime
 * delivered first, this observes the terminal state and stops silently.
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
          const cache = qc.getQueryData<BacktestRun[]>(['backtest_runs', user.id]) ?? [];
          const cached = cache.find((r) => r.id === runId);
          const alreadyTerminalInCache = cached && TERMINAL_STATUSES.has(cached.status);
          if (!alreadyTerminalInCache) {
            console.debug('[backtest] result delivered via poll fallback', runId);
            // Realtime didn't beat us — narrow refetch of just this run's full
            // row (single row, bounded), not the whole list.
            qc.invalidateQueries({ queryKey: ['backtest_run', runId] });
            // Also nudge the list cache to reflect the terminal status so the
            // History card updates without a list refetch.
            qc.setQueryData<BacktestRun[]>(['backtest_runs', user.id], (prev) => {
              const list = prev ?? [];
              const idx = list.findIndex((r) => r.id === runId);
              if (idx === -1) return list;
              const next = list.slice();
              next[idx] = { ...list[idx], status: status as BacktestRun['status'] };
              return next;
            });
          }
          return; // stop polling
        }
      } catch {
        /* swallow — next tick retries */
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
      // Insert-returning uses the slim column set — never select=*.
      const { data, error } = await supabase
        .from('backtest_runs')
        .insert({ ...input, user_id: user.id, status: 'pending' } as never)
        .select(LIST_COLUMNS)
        .single();
      if (error) throw error;
      return data as unknown as BacktestRun;
    },
    onSuccess: (row) => {
      // Prepend into local cache immediately. No invalidate — realtime INSERT
      // event will confirm and any race is handled by id-based dedup.
      if (!user?.id || !row?.id) return;
      qc.setQueryData<BacktestRun[]>(['backtest_runs', user.id], (prev) => {
        const list = prev ?? [];
        if (list.some((r) => r.id === row.id)) return list;
        return [stripLarge(row), ...list].slice(0, LIST_LIMIT);
      });
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
      return runId;
    },
    onSuccess: (runId) => {
      if (!user?.id || !runId) return;
      qc.setQueryData<BacktestRun[]>(['backtest_runs', user.id], (prev) =>
        (prev ?? []).filter((r) => r.id !== runId),
      );
      qc.removeQueries({ queryKey: ['backtest_run', runId] });
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
      return runId ?? null;
    },
    onSuccess: (runId) => {
      if (!user?.id) return;
      qc.setQueryData<BacktestRun[]>(['backtest_runs', user.id], (prev) => {
        const list = prev ?? [];
        return list.map((r) => {
          if (r.status !== 'pending' && r.status !== 'running') return r;
          if (runId && r.id !== runId) return r;
          return { ...r, status: 'failed', error_message: 'Canceled by user' };
        });
      });
    },
  });
}
