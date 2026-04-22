import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Quiz, QuizQuestion } from './useQuizzes';

export interface GuruQuizInput {
  id?: string;
  lesson_id: string;
  title: string;
  pass_threshold: number;
  questions: QuizQuestion[];
}

function mapQuiz(row: Record<string, unknown>): Quiz {
  return {
    ...(row as unknown as Quiz),
    questions: (row.questions as unknown as QuizQuestion[]) ?? [],
  };
}

export function useGuruQuizByLesson(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guru-quiz', 'lesson', lessonId],
    queryFn: async (): Promise<Quiz | null> => {
      if (!lessonId || !user) return null;
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('content_type', 'guru')
        .eq('author_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQuiz(data) : null;
    },
    enabled: !!lessonId && !!user?.id,
  });
}

export function useSaveGuruQuiz() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: GuruQuizInput): Promise<Quiz> => {
      if (!user) throw new Error('Not authenticated');
      const payload = {
        lesson_id: input.lesson_id,
        title: input.title,
        pass_threshold: input.pass_threshold,
        questions: input.questions as unknown as never,
        module: 'guru_custom',
        content_type: 'guru',
        author_id: user.id,
        is_published: true,
      };
      if (input.id) {
        const { data, error } = await supabase
          .from('quizzes')
          .update(payload)
          .eq('id', input.id)
          .eq('author_id', user.id)
          .select('*')
          .single();
        if (error) throw error;
        return mapQuiz(data);
      }
      const { data, error } = await supabase
        .from('quizzes')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return mapQuiz(data);
    },
    onSuccess: (quiz) => {
      qc.invalidateQueries({ queryKey: ['guru-quiz', 'lesson', quiz.lesson_id] });
    },
  });
}

export function useDeleteGuruQuiz() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (quizId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('author_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru-quiz'] });
    },
  });
}
