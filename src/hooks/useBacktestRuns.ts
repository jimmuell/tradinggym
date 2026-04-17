import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

export function useBacktestRuns() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['backtest_runs', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<BacktestRun[]> => {
      const { data, error } = await supabase
        .from('backtest_runs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BacktestRun[];
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
        .insert({ ...input, user_id: user.id, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data as BacktestRun;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest_runs', user?.id] });
    },
  });
}
