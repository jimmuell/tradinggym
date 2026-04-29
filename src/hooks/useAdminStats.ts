import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AdminStats = {
  total_users: number;
  users_this_week: number;
  users_this_month: number;
  users_today: number;
  plan_starter: number;
  plan_pro: number;
  plan_expert: number;
  plan_guru: number;
  plan_admin: number;
  tier_foundation: number;
  tier_1: number;
  tier_2: number;
  tier_3: number;
  tier_coach: number;
  mrr: number;
  total_strategies: number;
  strategies_this_week: number;
  total_trades: number;
  trades_this_week: number;
  total_playback_sessions: number;
  active_gurus: number;
  pending_applications: number;
  total_classes: number;
  total_enrollments: number;
  active_invites: number;
  used_invites: number;
  signup_trend: { date: string; signups: number }[];
};

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: ['admin-stats'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_detailed_stats');
      if (error) throw error;
      return data as unknown as AdminStats;
    },
    refetchInterval: 30000,
  });
}
