import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LiveSession } from '@/types/guru';

export function useClassSessions(classId: string | undefined) {
  const query = useQuery({
    queryKey: ['class-sessions', classId],
    queryFn: async (): Promise<LiveSession[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('class_id', classId)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LiveSession[];
    },
    enabled: !!classId,
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
