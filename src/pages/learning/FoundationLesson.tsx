import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFoundationLessons, useLesson } from '@/hooks/useLessons';
import { useQuizByModule } from '@/hooks/useQuizzes';
import { useGraduateFoundation } from '@/hooks/useGraduateFoundation';
import { useMarkLessonComplete } from '@/hooks/useLessonProgress';
import { useTier } from '@/contexts/TierContext';
import LessonRenderer from '@/components/learning/LessonRenderer';
import QuizRunner from '@/components/learning/QuizRunner';
import RiskAcknowledgmentModal from '@/components/learning/RiskAcknowledgmentModal';

function QuizView() {
  const navigate = useNavigate();
  const { data: quiz, isLoading } = useQuizByModule('foundation');
  const { data: lessons } = useFoundationLessons();
  const { user } = useAuth();
  const graduate = useGraduateFoundation();
  const { currentTier } = useTier();
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile-risk-ack', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('risk_acknowledged_at')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as { risk_acknowledged_at: string | null } | null;
    },
    enabled: !!user?.id,
  });

  const lessonTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    (lessons ?? []).forEach((l) => {
      map[l.id] = l.title;
    });
    return map;
  }, [lessons]);

  function doPromote() {
    graduate.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          setPromotionMessage("Welcome to Price Action — the Simulator is now unlocked!");
        }
      },
    });
  }

  function handlePassed() {
    if (currentTier === 'foundation') {
      if (profile?.risk_acknowledged_at) {
        doPromote();
      } else {
        setShowRiskModal(true);
      }
    } else {
      setPromotionMessage("Congratulations! You've unlocked Tier 1 — Pure Price Action.");
    }
  }

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
      <RiskAcknowledgmentModal
        open={showRiskModal}
        onAcknowledged={() => {
          setShowRiskModal(false);
          doPromote();
        }}
      />
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
        lessonTitleById={lessonTitleById}
        promotionMessage={promotionMessage}
        onPassed={handlePassed}
        onContinue={() => navigate('/learning/tier1')}
        onBackToFoundation={() => navigate('/learning/foundation')}
        onReviewLesson={() => navigate('/learning/foundation')}
      />
    </div>
  );
}

function LessonView({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate();
  const { data: lesson, isLoading, isError } = useLesson(lessonId);
  const markComplete = useMarkLessonComplete();

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
          markComplete.mutate(lesson.id, {
            onSettled: () => navigate('/learning/foundation'),
          });
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
