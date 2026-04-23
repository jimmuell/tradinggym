import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, History, Lock } from 'lucide-react';
import { useFoundationLessons } from '@/hooks/useLessons';
import { useQuizByModule, useBestQuizAttempt, type QuizAttempt } from '@/hooks/useQuizzes';
import { useQuizAttempts } from '@/hooks/useQuizAttempts';
import { useTier } from '@/contexts/TierContext';
import QuizResponsesReview from '@/components/learning/QuizResponsesReview';

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
  const { data: attempts, isLoading: attemptsLoading } = useQuizAttempts(quiz?.id);
  const { isUnlocked } = useTier();
  const tier1Unlocked = isUnlocked('tier1');
  const [completed, setCompleted] = useState<string[]>([]);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const [reviewing, setReviewing] = useState<QuizAttempt | null>(null);

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

      {!attemptsLoading && attempts && attempts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Quiz History</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {(showAllAttempts ? attempts : attempts.slice(0, 5)).map((a) => {
                const pct = Math.round((a.score / Math.max(a.total_questions, 1)) * 100);
                const dateLabel = new Date(a.completed_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{dateLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.score}/{a.total_questions} — {pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.passed ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not passed
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewing(a)}
                        disabled={!a.responses || a.responses.length === 0}
                      >
                        Review
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {attempts.length > 5 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllAttempts((v) => !v)}
                >
                  {showAllAttempts ? 'Show less' : `Show all (${attempts.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz attempt review</DialogTitle>
            {reviewing && (
              <DialogDescription>
                {new Date(reviewing.completed_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                — {reviewing.score}/{reviewing.total_questions} (
                {Math.round((reviewing.score / Math.max(reviewing.total_questions, 1)) * 100)}%)
              </DialogDescription>
            )}
          </DialogHeader>
          {reviewing && <QuizResponsesReview responses={reviewing.responses ?? []} expandAll />}
        </DialogContent>
      </Dialog>

      <Card className={(passed || tier1Unlocked) ? 'border-l-4 border-l-green-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Foundation Assessment</CardTitle>
            </div>
            {(passed || tier1Unlocked) ? (
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
          {tier1Unlocked ? (
            <>
              <CardDescription className="mb-4 text-green-600 dark:text-green-400">
                Foundation Complete — Tier 1 unlocked!
              </CardDescription>
              <Button size="sm" variant="outline" onClick={() => navigate('/learning/tier1')}>
                Continue to Tier 1
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </>
          ) : passed ? (
            <>
              <CardDescription className="mb-4 text-green-600 dark:text-green-400">
                Foundation Complete — {passThreshold}%+ achieved. Tier 1 unlocked!
              </CardDescription>
              <Button size="sm" onClick={() => navigate('/learning/tier1')}>
                Continue to Tier 1
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </>
          ) : bestAttempt ? (
            <>
              <CardDescription className="mb-4">
                Your best score: {bestScorePct}%. You need {passThreshold}% to pass.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => navigate('/learning/foundation/quiz')}>
                  Retake Assessment
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
                {attempts && attempts.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReviewing(attempts[0])}
                    disabled={!attempts[0].responses || attempts[0].responses.length === 0}
                  >
                    Quiz Results
                  </Button>
                )}
              </div>
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
