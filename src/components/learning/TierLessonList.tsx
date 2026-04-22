import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { useLessonsByModule } from '@/hooks/useLessons';

const STORAGE_KEY = 'completedLessons';

function getCompleted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface TierLessonListProps {
  module: string;
  basePath: string;
}

export default function TierLessonList({ module, basePath }: TierLessonListProps) {
  const navigate = useNavigate();
  const { data: lessons, isLoading } = useLessonsByModule(module);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getCompleted());
    const onFocus = () => setCompleted(getCompleted());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const completedCount = lessons?.filter((l) => completed.includes(l.id)).length ?? 0;
  const totalCount = lessons?.length ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount || 0} lessons complete
          </span>
        </div>
        <Progress value={totalCount ? (completedCount / totalCount) * 100 : 0} className="h-2" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
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
                        Lesson {idx + 1}: {lesson.title}
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
                  <Button size="sm" onClick={() => navigate(`${basePath}/${lesson.id}`)}>
                    {isComplete ? 'Review Lesson' : 'Start Lesson'}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
