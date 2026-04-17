import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type { LiveSession, SessionFormData } from '@/types/guru';

export function useGuruSessions() {
  const { data: guruProfile } = useGuruProfile();
  const qc = useQueryClient();
  const guruId = guruProfile?.id;
  const queryKey = ['guru-sessions', guruId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<LiveSession[]> => {
      if (!guruId) return [];
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('guru_id', guruId)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LiveSession[];
    },
    enabled: !!guruId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });
  const all = query.data ?? [];
  const upcomingSessions = all
    .filter((s) => s.status !== 'ended')
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const pastSessions = all
    .filter((s) => s.status === 'ended')
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  const createSession = useMutation({
    mutationFn: async (data: SessionFormData): Promise<LiveSession> => {
      if (!guruId) throw new Error('No guru profile');
      const { data: row, error } = await supabase
        .from('live_sessions')
        .insert({
          guru_id: guruId,
          cohort_id: data.cohort_id,
          title: data.title,
          description: data.description || null,
          scheduled_at: data.scheduled_at,
        })
        .select('*')
        .single();
      if (error) throw error;
      return row as LiveSession;
    },
    onSuccess: invalidate,
  });

  const updateSession = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SessionFormData>;
    }): Promise<LiveSession> => {
      const payload = {
        ...data,
        ...('description' in data
          ? { description: data.description ? data.description : null }
          : {}),
      };
      const { data: row, error } = await supabase
        .from('live_sessions')
        .update(payload as never)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return row as LiveSession;
    },
    onSuccess: invalidate,
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('live_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const startSession = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('live_sessions')
        .update({ status: 'live' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const endSession = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('live_sessions')
        .update({ status: 'ended' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    sessions: all,
    upcomingSessions,
    pastSessions,
    isLoading: query.isLoading,
    createSession,
    updateSession,
    deleteSession,
    startSession,
    endSession,
  };
}
