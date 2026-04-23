import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_lesson_id?: string | null;
  source_lesson_title?: string | null;
  source_slide_index?: number | null;
}

export interface Quiz {
  id: string;
  lesson_id: string | null;
  module: string;
  title: string;
  pass_threshold: number;
  content_type: string;
  author_id: string | null;
  questions: QuizQuestion[];
  is_published: boolean | null;
  created_at: string;
}

export interface QuizAnswer {
  question_id: string;
  selected_index: number;
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  answers: QuizAnswer[];
  responses?: import('./useQuizAttempts').QuizResponse[];
  completed_at: string;
}

// Re-export the new mutation hook so existing imports keep working.
export { useSaveQuizAttempt } from './useQuizAttempts';

function mapQuiz(row: Record<string, unknown>): Quiz {
  return {
    ...(row as unknown as Quiz),
    questions: (row.questions as unknown as QuizQuestion[]) ?? [],
  };
}

export function useQuizByModule(module: string) {
  return useQuery({
    queryKey: ['quiz', 'module', module],
    queryFn: async (): Promise<Quiz | null> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module', module)
        .eq('content_type', 'platform')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQuiz(data) : null;
    },
    enabled: !!module,
  });
}

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async (): Promise<Quiz | null> => {
      if (!quizId) return null;
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQuiz(data) : null;
    },
    enabled: !!quizId,
  });
}

export function useBestQuizAttempt(quizId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quiz-attempt', 'best', quizId],
    queryFn: async (): Promise<QuizAttempt | null> => {
      if (!quizId || !user) return null;
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        answers: (data.answers as unknown as QuizAnswer[]) ?? [],
      } as unknown as QuizAttempt;
    },
    enabled: !!quizId && !!user,
  });
}
