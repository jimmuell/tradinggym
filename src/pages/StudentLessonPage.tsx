import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LessonRenderer from '@/components/learning/LessonRenderer';
import QuizRunner from '@/components/learning/QuizRunner';
import { useStudentClass } from '@/hooks/useStudentEnrollments';
import { useLesson } from '@/hooks/useLessons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz, QuizQuestion } from '@/hooks/useQuizzes';

function useLessonQuiz(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['student-lesson-quiz', lessonId],
    queryFn: async (): Promise<Quiz | null> => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('content_type', 'guru')
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...(data as unknown as Quiz),
        questions: (data.questions as unknown as QuizQuestion[]) ?? [],
      };
    },
    enabled: !!lessonId,
  });
}

export default function StudentLessonPage() {
  const { classId, lessonId } = useParams<{ classId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { enrolled, isLoading: enrLoading } = useStudentClass(classId);
  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId);
  const { data: quiz } = useLessonQuiz(lessonId);

  const [stage, setStage] = useState<'lesson' | 'quiz-prompt' | 'quiz'>('lesson');

  if (enrLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!enrolled) return <Navigate to="/classes" replace />;

  function handleLessonComplete() {
    if (quiz) {
      setStage('quiz-prompt');
    } else {
      navigate(`/classes/${classId}`);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Link
        to={`/classes/${classId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to class
      </Link>

      {stage === 'lesson' && (
        <LessonRenderer
          lesson={lesson}
          isLoading={lessonLoading}
          onComplete={handleLessonComplete}
        />
      )}

      {stage === 'quiz-prompt' && quiz && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-semibold">Lesson complete</h2>
            <p className="text-sm text-muted-foreground">
              Take the quiz to check your understanding.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/classes/${classId}`)}>
                Skip for now
              </Button>
              <Button onClick={() => setStage('quiz')}>Take Quiz</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'quiz' && quiz && (
        <QuizRunner
          quiz={quiz}
          onComplete={() => navigate(`/classes/${classId}`)}
          onReviewLesson={() => setStage('lesson')}
        />
      )}
    </div>
  );
}
