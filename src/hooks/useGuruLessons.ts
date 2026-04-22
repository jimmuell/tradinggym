import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Lesson, LessonSlide } from './useLessons';

export interface GuruLessonInput {
  id?: string;
  title: string;
  description: string | null;
  class_id: string;
  estimated_minutes: number;
  is_published: boolean;
  slides: LessonSlide[];
}

function mapLesson(row: Record<string, unknown>): Lesson {
  return {
    ...(row as unknown as Lesson),
    slides: (row.slides as unknown as LessonSlide[]) ?? [],
  };
}

export function useGuruLessons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guru-lessons', user?.id],
    queryFn: async (): Promise<Lesson[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('author_id', user.id)
        .eq('content_type', 'guru')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapLesson);
    },
    enabled: !!user?.id,
  });
}

export function useGuruLesson(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guru-lesson', lessonId],
    queryFn: async (): Promise<Lesson | null> => {
      if (!lessonId || !user) return null;
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('author_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapLesson(data) : null;
    },
    enabled: !!lessonId && !!user?.id,
  });
}

export function useSaveGuruLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: GuruLessonInput): Promise<Lesson> => {
      if (!user) throw new Error('Not authenticated');
      const payload = {
        title: input.title,
        description: input.description,
        class_id: input.class_id,
        estimated_minutes: input.estimated_minutes,
        is_published: input.is_published,
        slides: input.slides as unknown as never,
        content_type: 'guru',
        author_id: user.id,
        module: 'guru_custom',
        module_order: 0,
        tier_required: 'foundation',
      };
      if (input.id) {
        const { data, error } = await supabase
          .from('lessons')
          .update(payload)
          .eq('id', input.id)
          .eq('author_id', user.id)
          .select('*')
          .single();
        if (error) throw error;
        return mapLesson(data);
      }
      const { data, error } = await supabase
        .from('lessons')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return mapLesson(data);
    },
    onSuccess: (lesson) => {
      qc.invalidateQueries({ queryKey: ['guru-lessons'] });
      qc.invalidateQueries({ queryKey: ['guru-lesson', lesson.id] });
      qc.invalidateQueries({ queryKey: ['class-guru-lessons', lesson.class_id] });
    },
  });
}

export function useDeleteGuruLesson() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lessonId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('author_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru-lessons'] });
      qc.invalidateQueries({ queryKey: ['class-guru-lessons'] });
    },
  });
}

export function useClassGuruLessons(classId: string | undefined) {
  return useQuery({
    queryKey: ['class-guru-lessons', classId],
    queryFn: async (): Promise<Lesson[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('class_id', classId)
        .eq('content_type', 'guru')
        .eq('is_published', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapLesson);
    },
    enabled: !!classId,
  });
}
