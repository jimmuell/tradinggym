import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useLesson } from '@/hooks/useLessons';
import { useTier, type TierState } from '@/contexts/TierContext';
import LessonRenderer from '@/components/learning/LessonRenderer';

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

interface TierLessonPageProps {
  tier: 'tier1' | 'tier2' | 'tier3';
  modulePrefix: string;
  backPath: string;
  backLabel: string;
}

export default function TierLessonPage({ tier, modulePrefix, backPath, backLabel }: TierLessonPageProps) {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { isUnlocked } = useTier();
  const tierUnlocked = isUnlocked(tier as TierState);

  const { data: lesson, isLoading, isError } = useLesson(lessonId);

  useEffect(() => {
    if (!tierUnlocked) {
      navigate('/learning', { replace: true });
      return;
    }
    if (!isLoading && (isError || !lesson)) {
      navigate(backPath, { replace: true });
      return;
    }
    if (
      lesson &&
      (lesson.tier_required !== tier ||
        lesson.content_type !== 'platform' ||
        !lesson.module.startsWith(modulePrefix))
    ) {
      navigate(backPath, { replace: true });
    }
  }, [lesson, isLoading, isError, navigate, tierUnlocked, tier, modulePrefix, backPath]);

  if (!lessonId) return null;

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
      <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to {backLabel}
      </Button>
      <LessonRenderer
        lesson={lesson}
        onComplete={() => {
          markComplete(lesson.id);
          navigate(backPath);
        }}
      />
    </div>
  );
}
