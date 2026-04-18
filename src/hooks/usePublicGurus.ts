import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicGuru {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  bio: string | null;
  primary_instrument: string | null;
  primary_strategy: string | null;
  referral_code: string | null;
  referral_discount_pct: number | null;
  tier_state: string | null;
  win_rate: number | null;
  total_trades: number;
  active_students: number;
}

export function usePublicGurus() {
  return useQuery<PublicGuru[]>({
    queryKey: ['public-gurus'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_guru_directory');
      if (error) throw error;
      return ((data ?? []) as unknown as PublicGuru[]).map((g) => ({
        ...g,
        total_trades: Number(g.total_trades ?? 0),
        active_students: Number(g.active_students ?? 0),
      }));
    },
  });
}

export function usePublicGuru(guruId: string | undefined) {
  return useQuery<PublicGuru | null>({
    queryKey: ['public-guru', guruId],
    enabled: !!guruId,
    queryFn: async () => {
      if (!guruId) return null;
      const { data, error } = await supabase.rpc('get_public_guru_profile', { _guru_id: guruId });
      if (error) throw error;
      const rows = (data ?? []) as unknown as PublicGuru[];
      if (rows.length === 0) return null;
      const g = rows[0];
      return {
        ...g,
        total_trades: Number(g.total_trades ?? 0),
        active_students: Number(g.active_students ?? 0),
      };
    },
  });
}
