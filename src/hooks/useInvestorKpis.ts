import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvestorKpis {
  total_users: number;
  users_this_month: number;
  users_last_month: number;
  mrr: number;
  arr: number;
  paid_users: number;
  free_users: number;
  conversion_rate: number;
  plan_starter: number;
  plan_pro: number;
  plan_expert: number;
  plan_guru: number;
  total_strategies: number;
  total_trades: number;
  active_gurus: number;
  total_classes: number;
  total_enrollments: number;
  total_lessons: number;
  total_quiz_attempts: number;
  playback_scenarios: number;
  weekly_growth: { week: string; signups: number }[];
  mrr_trend: { week: string; mrr_at_signup: number }[];
}

export function useInvestorKpis() {
  return useQuery({
    queryKey: ['investor-kpis'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_investor_kpis');
      if (error) throw error;
      return data as unknown as InvestorKpis;
    },
  });
}
