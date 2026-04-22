import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type LogTradeInput = {
  direction: 'long' | 'short';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  result?: 'win' | 'loss' | 'breakeven' | null;
  checklist_session_id?: string | null;
};

export function useLogTrade() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogTradeInput) => {
      if (!user) throw new Error('Not authenticated');
      const now = new Date().toISOString();
      const payload = {
        user_id: user.id,
        symbol: 'MES',
        timeframe: '5m',
        session_type: 'live',
        direction: input.direction,
        entry_price: input.entry_price,
        stop_loss: input.stop_loss,
        take_profit: input.take_profit,
        result: input.result ?? null,
        checklist_session_id: input.checklist_session_id ?? null,
        opened_at: now,
        closed_at: input.result ? now : null,
      };
      const { data, error } = await supabase.from('trades').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-trades-today', user?.id] });
    },
  });
}

export function useTodayLiveTrades() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['live-trades-today', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .eq('session_type', 'live')
        .gte('opened_at', startOfDay.toISOString())
        .order('opened_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}
