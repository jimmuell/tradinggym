import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Lesson, LessonSlide } from '@/hooks/useLessons';

interface LessonRendererProps {
  lesson: Lesson | null | undefined;
  isLoading?: boolean;
  onComplete: () => void;
}

function renderInline(text: string): string {
  // Escape HTML first
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold then italic
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function SlideView({ slide }: { slide: LessonSlide }) {
  const paragraphs = slide.body.split(/\n\n+/);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>

      {slide.image_key && (
        <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
          Image: {slide.image_key}
        </div>
      )}

      <div className="space-y-3 text-foreground/90 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(p) }} />
        ))}
      </div>

      {slide.bullet_points && slide.bullet_points.length > 0 && (
        <ul className="list-disc list-outside pl-6 space-y-2 text-foreground/90">
          {slide.bullet_points.map((bp, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(bp) }} />
          ))}
        </ul>
      )}

      {slide.tip && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-4 flex gap-3">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90" dangerouslySetInnerHTML={{ __html: renderInline(slide.tip) }} />
        </div>
      )}
    </div>
  );
}

export default function LessonRenderer({ lesson, isLoading, onComplete }: LessonRendererProps) {
  const [index, setIndex] = useState(0);

  const slides = lesson?.slides ?? [];
  const total = slides.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && !isFirst) setIndex((i) => i - 1);
      else if (e.key === 'ArrowRight') {
        if (isLast) onComplete();
        else setIndex((i) => i + 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFirst, isLast, onComplete]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[720px] mx-auto space-y-6">
        <Skeleton className="h-2 w-full" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson || total === 0) {
    return (
      <div className="w-full max-w-[720px] mx-auto">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            This lesson has no content yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const slide = slides[index];
  const progress = ((index + 1) / total) * 100;

  return (
    <div className="w-full max-w-[720px] mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{index + 1} of {total}</span>
          <span>{lesson.title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          <SlideView slide={slide} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIndex((i) => i - 1)} disabled={isFirst}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        {isLast ? (
          <Button onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Complete Lesson
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
