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
  direction: string | null;
  commission_pct: number | null;
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
  run_validation?: boolean;
  validation_iterations?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  stop_loss_points?: number;
  take_profit_points?: number;
  slippage_ticks?: number;
  qty_value?: number;
}

export function useBacktestRuns() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_runs', user?.id],
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const runs = query.state.data as BacktestRun[] | undefined;
      const hasActive = runs?.some((r) => r.status === 'pending' || r.status === 'running');
      return hasActive ? 5000 : false;
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
