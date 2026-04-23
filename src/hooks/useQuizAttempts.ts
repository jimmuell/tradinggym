import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { QuizAnswer, QuizAttempt } from '@/hooks/useQuizzes';

export interface QuizResponse {
  question_id: string;
  question_text: string;
  selected_answer: number;
  correct_answer: number;
  is_correct: boolean;
  options: string[];
  explanation: string;
  source_lesson_id: string | null;
  source_lesson_title: string | null;
  source_slide_index: number;
}

export function useQuizAttempts(quizId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quiz-attempts', quizId, user?.id],
    queryFn: async (): Promise<QuizAttempt[]> => {
      if (!quizId || !user) return [];
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        answers: (row.answers as unknown as QuizAnswer[]) ?? [],
        responses: (row.responses as unknown as QuizResponse[]) ?? [],
      })) as QuizAttempt[];
    },
    enabled: !!quizId && !!user,
  });
}

export function useSaveQuizAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      quiz_id: string;
      score: number;
      total_questions: number;
      passed: boolean;
      answers: QuizAnswer[];
      responses: QuizResponse[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: input.quiz_id,
          score: input.score,
          total_questions: input.total_questions,
          passed: input.passed,
          answers: input.answers as unknown as never,
          responses: input.responses as unknown as never,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.quiz_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', 'best', variables.quiz_id] });
    },
  });
}
