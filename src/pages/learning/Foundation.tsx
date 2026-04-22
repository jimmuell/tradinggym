import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, Lock } from 'lucide-react';
import { useFoundationLessons } from '@/hooks/useLessons';
import { useQuizByModule, useBestQuizAttempt } from '@/hooks/useQuizzes';

const STORAGE_KEY = 'completedLessons';

function getCompleted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function FoundationLearning() {
  const navigate = useNavigate();
  const { data: lessons, isLoading: lessonsLoading } = useFoundationLessons();
  const { data: quiz, isLoading: quizLoading } = useQuizByModule('foundation');
  const { data: bestAttempt, isLoading: attemptLoading } = useBestQuizAttempt(quiz?.id);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getCompleted());
    const onFocus = () => setCompleted(getCompleted());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const isLoading = lessonsLoading || quizLoading || attemptLoading;
  const completedCount = lessons?.filter((l) => completed.includes(l.id)).length ?? 0;
  const totalCount = lessons?.length ?? 0;
  const allModulesComplete = totalCount > 0 && completedCount === totalCount;

  const passed = bestAttempt?.passed === true;
  const passThreshold = quiz?.pass_threshold ?? 80;
  const bestScorePct = bestAttempt
    ? Math.round((bestAttempt.score / Math.max(bestAttempt.total_questions, 1)) * 100)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Foundation — Trading Literacy</h1>
        <p className="text-muted-foreground mt-1">Master the basics before your first trade.</p>
        <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount || 5} modules complete
          </span>
        </div>
        <Progress value={totalCount ? (completedCount / totalCount) * 100 : 0} className="h-2" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(lessons ?? []).map((lesson, idx) => {
            const isComplete = completed.includes(lesson.id);
            return (
              <Card
                key={lesson.id}
                className={`transition-opacity ${
                  isComplete ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">
                        Module {idx + 1}: {lesson.title}
                      </CardTitle>
                    </div>
                    {isComplete ? (
                      <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not started
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">{lesson.description}</CardDescription>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                    <Clock className="h-3 w-3" />
                    {lesson.estimated_minutes ?? 10} min
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/learning/foundation/${lesson.id}`)}
                  >
                    {isComplete ? 'Review Module' : 'Start Module'}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className={passed ? 'border-l-4 border-l-green-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Foundation Assessment</CardTitle>
            </div>
            {passed ? (
              <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Passed
              </Badge>
            ) : !allModulesComplete ? (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {passed ? (
            <>
              <CardDescription className="mb-4 text-green-600 dark:text-green-400">
                Foundation Complete — {passThreshold}%+ achieved. Tier 1 unlocked!
              </CardDescription>
            </>
          ) : bestAttempt ? (
            <>
              <CardDescription className="mb-4">
                Your best score: {bestScorePct}%. You need {passThreshold}% to pass.
              </CardDescription>
              <Button size="sm" onClick={() => navigate('/learning/foundation/quiz')}>
                Retake Assessment
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <CardDescription className="mb-4">
                Complete all {totalCount || 5} modules, then take the Foundation Assessment to unlock Tier 1.
              </CardDescription>
              {!allModulesComplete && (
                <p className="text-xs text-muted-foreground mb-4">
                  Complete all modules first.
                </p>
              )}
              <Button
                size="sm"
                disabled={!allModulesComplete || !quiz}
                onClick={() => navigate('/learning/foundation/quiz')}
              >
                Take Assessment
                {allModulesComplete ? (
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <Lock className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
