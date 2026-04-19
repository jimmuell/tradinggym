import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LiveSession } from '@/types/guru';

export function useCohortSessions(cohortId: string | undefined) {
  const query = useQuery({
    queryKey: ['cohort-sessions', cohortId],
    queryFn: async (): Promise<LiveSession[]> => {
      if (!cohortId) return [];
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LiveSession[];
    },
    enabled: !!cohortId,
  });

  const sessions = query.data ?? [];
  const upcomingSessions = sessions.filter((s) => s.status !== 'ended');
  const liveSession = sessions.find((s) => s.status === 'live') ?? null;

  return {
    sessions,
    upcomingSessions,
    liveSession,
    isLoading: query.isLoading,
  };
}
