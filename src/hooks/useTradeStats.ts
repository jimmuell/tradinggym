import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTradeStats() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['trade-stats', user?.id],
    queryFn: async () => {
      if (!user) return { tradeCount: 0, winRate: 0 };
      const { data, error } = await supabase
        .from('trades')
        .select('result')
        .eq('user_id', user.id)
        .eq('session_type', 'simulator');
      if (error) throw error;
      const rows = data ?? [];
      const tradeCount = rows.length;
      const wins = rows.filter((r) => r.result === 'win').length;
      const winRate = tradeCount > 0 ? Math.round((wins / tradeCount) * 1000) / 10 : 0;
      return { tradeCount, winRate };
    },
    enabled: !!user,
  });

  return {
    tradeCount: query.data?.tradeCount ?? 0,
    winRate: query.data?.winRate ?? 0,
    isLoading: query.isLoading,
  };
}
