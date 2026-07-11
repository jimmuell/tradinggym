import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PRACTICE_STARTING_BALANCE, formatMoney } from '@/lib/practiceAccount';

export type PracticeTrade = {
  id: string;
  user_id: string;
  symbol: string | null;
  direction: string | null;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  result: string | null;
  pnl: number | null;
  contracts: number | null;
  opened_at: string | null;
  closed_at: string | null;
  session_type: string | null;
  notes: string | null;
};

export function usePracticeAccount() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['practice-account', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .eq('session_type', 'simulator')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PracticeTrade[];
    },
  });

  const trades = query.data ?? [];
  const closedTrades = trades.filter((t) => t.closed_at != null);
  const openPositions = trades.filter((t) => t.closed_at == null);
  const realizedPnl = closedTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const balance = PRACTICE_STARTING_BALANCE + realizedPnl;

  return {
    startingBalance: PRACTICE_STARTING_BALANCE,
    realizedPnl,
    balance,
    equity: balance,
    openPositions,
    closedTrades,
    tradeCount: closedTrades.length,
    isLoading: query.isLoading,
    formatMoney,
  };
}
