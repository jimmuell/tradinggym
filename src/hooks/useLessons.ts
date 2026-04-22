import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LessonSlide {
  id: string;
  title: string;
  body: string;
  bullet_points?: string[] | null;
  tip?: string | null;
  image_key?: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  module: string;
  module_order: number;
  tier_required: string;
  content_type: string;
  author_id: string | null;
  class_id: string | null;
  slides: LessonSlide[];
  estimated_minutes: number | null;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useLessonsByModule(module: string) {
  return useQuery({
    queryKey: ['lessons', module],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module', module)
        .eq('is_published', true)
        .order('module_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        slides: (row.slides as unknown as LessonSlide[]) ?? [],
      })) as Lesson[];
    },
    enabled: !!module,
  });
}

export function useFoundationLessons() {
  return useQuery({
    queryKey: ['lessons', 'foundation-all'],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('content_type', 'platform')
        .eq('tier_required', 'foundation')
        .eq('is_published', true)
        .like('module', 'f%')
        .order('module_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        slides: (row.slides as unknown as LessonSlide[]) ?? [],
      })) as Lesson[];
    },
  });
}

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<Lesson | null> => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        slides: (data.slides as unknown as LessonSlide[]) ?? [],
      } as Lesson;
    },
    enabled: !!lessonId,
  });
}
