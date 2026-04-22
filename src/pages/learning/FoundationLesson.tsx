import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useLesson } from '@/hooks/useLessons';
import { useQuizByModule } from '@/hooks/useQuizzes';
import LessonRenderer from '@/components/learning/LessonRenderer';
import QuizRunner from '@/components/learning/QuizRunner';

const STORAGE_KEY = 'completedLessons';

function markComplete(lessonId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(lessonId)) {
      arr.push(lessonId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}

function QuizView() {
  const navigate = useNavigate();
  const { data: quiz, isLoading } = useQuizByModule('foundation');

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Assessment not available.</p>
        <Button variant="ghost" onClick={() => navigate('/learning/foundation')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Foundation
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/learning/foundation')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Foundation
      </Button>
      <QuizRunner
        quiz={quiz}
        onComplete={() => navigate('/learning/foundation')}
        onReviewLesson={() => navigate('/learning/foundation')}
      />
    </div>
  );
}

function LessonView({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate();
  const { data: lesson, isLoading, isError } = useLesson(lessonId);

  useEffect(() => {
    if (!isLoading && (isError || !lesson)) {
      navigate('/learning/foundation', { replace: true });
      return;
    }
    if (lesson && (lesson.tier_required !== 'foundation' || lesson.content_type !== 'platform')) {
      navigate('/learning/foundation', { replace: true });
    }
  }, [lesson, isLoading, isError, navigate]);

  if (isLoading || !lesson) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/learning/foundation')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Foundation
      </Button>
      <LessonRenderer
        lesson={lesson}
        onComplete={() => {
          markComplete(lesson.id);
          navigate('/learning/foundation');
        }}
      />
    </div>
  );
}

export default function FoundationLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();

  if (!lessonId) {
    return null;
  }

  if (lessonId === 'quiz') {
    return <QuizView />;
  }

  return <LessonView lessonId={lessonId} />;
}
