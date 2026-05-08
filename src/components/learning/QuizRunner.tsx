import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, X, CheckCircle2, AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, QuizAnswer } from '@/hooks/useQuizzes';
import { useSaveQuizAttempt, type QuizResponse } from '@/hooks/useQuizAttempts';
import QuizResponsesReview from './QuizResponsesReview';

interface QuizRunnerProps {
  quiz: Quiz;
  /** Map of lesson id -> display title, used for "Review this in: …" links. */
  lessonTitleById?: Record<string, string>;
  /** Optional success message shown after a passing attempt (e.g. tier promotion). */
  promotionMessage?: string | null;
  /** Called when user clicks the post-pass primary action. */
  onContinue?: () => void;
  /** Called when user clicks the post-fail primary action. */
  onBackToFoundation?: () => void;
  /** Called immediately after a passing attempt is saved. */
  onPassed?: () => void;
  /** Legacy: kept for backward compatibility — not used for navigation anymore. */
  onComplete?: (score: number, total: number, passed: boolean) => void;
  onReviewLesson?: () => void;
  /** When true, skip persisting the attempt to the database (admin/guru preview). */
  previewMode?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizRunner({
  quiz,
  lessonTitleById,
  promotionMessage,
  onContinue,
  onBackToFoundation,
  onPassed,
  onComplete,
  onReviewLesson,
  previewMode = false,
}: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const saveAttempt = useSaveQuizAttempt();
  const questions = quiz.questions;
  const total = questions.length;
  const current = questions[index];
  const isLast = index === total - 1;

  const score = answers.filter((a) => a.correct).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percent >= quiz.pass_threshold;

  const responses: QuizResponse[] = useMemo(() => {
    return answers.map((a) => {
      const q = questions.find((qq) => qq.id === a.question_id);
      const sourceId = q?.source_lesson_id ?? null;
      const fallbackTitle = q?.source_lesson_title ?? null;
      const lookedUp = sourceId && lessonTitleById ? lessonTitleById[sourceId] : null;
      return {
        question_id: a.question_id,
        question_text: q?.question ?? '',
        selected_answer: a.selected_index,
        correct_answer: q?.correct_index ?? -1,
        is_correct: a.correct,
        options: q?.options ?? [],
        explanation: q?.explanation ?? '',
        source_lesson_id: sourceId,
        source_lesson_title: lookedUp ?? fallbackTitle,
        source_slide_index: q?.source_slide_index ?? 0,
      };
    });
  }, [answers, questions, lessonTitleById]);

  useEffect(() => {
    if (!finished || savedOnce) return;
    setSavedOnce(true);
    saveAttempt.mutate(
      {
        quiz_id: quiz.id,
        score,
        total_questions: total,
        passed,
        answers,
        responses,
      },
      {
        onSuccess: () => {
          onComplete?.(score, total, passed);
          if (passed) onPassed?.();
        },
      }
    );
  }, [finished, savedOnce, saveAttempt, quiz.id, score, total, passed, answers, responses, onComplete, onPassed]);

  function handleSelect(optIndex: number) {
    if (selected !== null) return;
    setSelected(optIndex);
    setAnswers((prev) => [
      ...prev,
      {
        question_id: current.id,
        selected_index: optIndex,
        correct: optIndex === current.correct_index,
      },
    ]);
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function handleRetake() {
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setFinished(false);
    setSavedOnce(false);
  }

  function scrollToReview() {
    const el = document.getElementById('quiz-review-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (finished) {
    return (
      <div className="w-full max-w-[720px] mx-auto space-y-6">
        <Card
          className={cn(
            'border-2',
            passed ? 'border-green-500/40 bg-green-500/5' : 'border-amber-500/40 bg-amber-500/5'
          )}
        >
          <CardContent className="pt-6 space-y-4 text-center">
            {passed ? (
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-12 w-12 mx-auto text-amber-600 dark:text-amber-400" />
            )}
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {score} / {total} correct ({percent}%)
              </h2>
              {passed ? (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">PASSED</Badge>
              ) : (
                <Badge variant="destructive">NOT PASSED</Badge>
              )}
            </div>
            {passed && promotionMessage && (
              <p className="text-foreground/90 font-medium">{promotionMessage}</p>
            )}
            {!passed && (
              <p className="text-foreground/80">
                You need {quiz.pass_threshold}% to pass. Review the explanations below and try again.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button variant="outline" onClick={scrollToReview}>
                Review Answers
              </Button>
              <Button variant="outline" onClick={handleRetake}>
                Retake Quiz
              </Button>
              {passed ? (
                <Button onClick={() => onContinue?.()}>
                  Continue to Tier 1
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => onBackToFoundation?.()}>Back to Foundation</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div id="quiz-review-section" className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Per-question review</h3>
          <QuizResponsesReview responses={responses} />
          {onReviewLesson && !passed && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={onReviewLesson}>
                <BookOpen className="h-4 w-4 mr-1" />
                Review Lesson
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (total === 0 || !current) {
    return (
      <div className="w-full max-w-[720px] mx-auto">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            This quiz has no questions yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((index + 1) / total) * 100;
  const answered = selected !== null;

  return (
    <div className="w-full max-w-[720px] mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {index + 1} of {total}</span>
          <span>{quiz.title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground">{current.question}</h3>

          <div className="space-y-2">
            {current.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === current.correct_index;
              const showCorrect = answered && isCorrect;
              const showWrong = answered && isSelected && !isCorrect;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={cn(
                    'w-full text-left rounded-lg border p-4 flex items-start gap-3 transition-colors',
                    'border-border bg-card hover:bg-accent',
                    answered && 'cursor-not-allowed hover:bg-card',
                    showCorrect && 'border-green-500/60 bg-green-500/10 hover:bg-green-500/10',
                    showWrong && 'border-red-500/60 bg-red-500/10 hover:bg-red-500/10'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold',
                      'border-border bg-background',
                      showCorrect && 'border-green-500/60 text-green-700 dark:text-green-300',
                      showWrong && 'border-red-500/60 text-red-700 dark:text-red-300'
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="text-sm text-foreground pt-0.5 flex-1">{opt}</span>
                  {showCorrect && <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />}
                  {showWrong && <X className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Explanation</p>
              <p className="text-sm text-foreground/80">{current.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button onClick={handleNext} disabled={!answered}>
          {isLast ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
