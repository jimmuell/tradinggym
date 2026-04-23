import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizResponse } from '@/hooks/useQuizAttempts';

const LETTERS = ['A', 'B', 'C', 'D'];

interface QuizResponsesReviewProps {
  responses: QuizResponse[];
  /** When true, all items default open regardless of correctness (used in past-attempt dialog). */
  expandAll?: boolean;
}

export default function QuizResponsesReview({ responses, expandAll = false }: QuizResponsesReviewProps) {
  if (!responses || responses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No per-question detail available for this attempt.</p>
    );
  }

  const defaultOpen = expandAll
    ? responses.map((_, i) => `q-${i}`)
    : responses.map((r, i) => (!r.is_correct ? `q-${i}` : null)).filter(Boolean) as string[];

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
      {responses.map((r, i) => {
        const itemId = `q-${i}`;
        return (
          <AccordionItem
            key={itemId}
            value={itemId}
            className={cn(
              'rounded-lg border bg-card border-l-4',
              r.is_correct ? 'border-l-green-500/70' : 'border-l-red-500/70'
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-start gap-3 text-left flex-1 pr-2">
                {r.is_correct ? (
                  <Check className="h-4 w-4 mt-1 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="h-4 w-4 mt-1 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-medium text-foreground">
                  Q{i + 1}: {r.question_text}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <ul className="space-y-2">
                  {r.options.map((opt, optIdx) => {
                    const isUserChoice = optIdx === r.selected_answer;
                    const isCorrect = optIdx === r.correct_answer;
                    return (
                      <li
                        key={optIdx}
                        className={cn(
                          'flex items-start gap-3 rounded-md border p-3 text-sm',
                          'border-border bg-background',
                          isCorrect && 'border-green-500/60 bg-green-500/10',
                          isUserChoice && !isCorrect && 'border-red-500/60 bg-red-500/10'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                            'border-border bg-card',
                            isCorrect && 'border-green-500/60 text-green-700 dark:text-green-300',
                            isUserChoice && !isCorrect && 'border-red-500/60 text-red-700 dark:text-red-300'
                          )}
                        >
                          {LETTERS[optIdx] ?? optIdx + 1}
                        </span>
                        <span className="flex-1 text-foreground/90">{opt}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {isUserChoice && (isCorrect ? 'Your answer ✓' : 'Your answer')}
                          {!isUserChoice && isCorrect && 'Correct'}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {r.explanation && (
                  <div className="rounded-md bg-muted/60 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Explanation</p>
                    <p className="text-sm text-foreground/80">{r.explanation}</p>
                  </div>
                )}

                {!r.is_correct && r.source_lesson_id && (
                  <Link
                    to={`/learning/foundation/${r.source_lesson_id}?slide=${r.source_slide_index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>
                      Review this in:{' '}
                      <span className="font-semibold">{r.source_lesson_title ?? 'Lesson'}</span>
                      {' '}→ Slide {r.source_slide_index + 1}
                    </span>
                  </Link>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
