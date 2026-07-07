import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCompletedLessonIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lesson-progress', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => r.lesson_id as string);
    },
  });
}

export function useMarkLessonComplete() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user?.id) throw new Error('Not signed in');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('lesson_progress')
        .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id] });
    },
  });
}
