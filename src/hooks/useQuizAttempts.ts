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

export interface SubmitQuizResult {
  attempt_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  pass_threshold: number;
  answers: QuizAnswer[];
  responses: QuizResponse[];
}

export function useSaveQuizAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      quiz_id: string;
      // Server re-grades; these are ignored for the verdict but kept for API compatibility.
      score?: number;
      total_questions?: number;
      passed?: boolean;
      answers: QuizAnswer[];
      responses?: QuizResponse[];
    }): Promise<SubmitQuizResult> => {
      if (!user) throw new Error('Not authenticated');
      // Send only the chosen answers to the server. Server grades authoritatively.
      const clientAnswers = input.answers.map((a) => ({
        question_id: a.question_id,
        selected_index: a.selected_index,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('submit_quiz_attempt', {
        _quiz_id: input.quiz_id,
        _answers: clientAnswers,
      });
      if (error) throw error;
      return data as SubmitQuizResult;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.quiz_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', 'best', variables.quiz_id] });
    },
  });
}

