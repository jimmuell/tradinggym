import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ChevronRight, Eye, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import LessonRenderer from '@/components/learning/LessonRenderer';
import QuizRunner from '@/components/learning/QuizRunner';
import type { Lesson, LessonSlide } from '@/hooks/useLessons';
import type { Quiz, QuizQuestion } from '@/hooks/useQuizzes';

interface ChapterRow {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
}

type View =
  | { kind: 'overview' }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'quiz' };

export default function AdminCoursePreviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [view, setView] = useState<View>({ kind: 'overview' });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['admin-preview-course', courseId],
    enabled: !!isAdmin && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, tier_required, is_published')
        .eq('id', courseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['admin-preview-chapters', courseId],
    enabled: !!isAdmin && !!courseId,
    queryFn: async (): Promise<ChapterRow[]> => {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, description, display_order')
        .eq('course_id', courseId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const chapterIds = chapters.map((c) => c.id);

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-preview-lessons', courseId, chapterIds.join(',')],
    enabled: !!isAdmin && chapterIds.length > 0,
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('chapter_id', chapterIds)
        .order('module_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        slides: (row.slides as unknown as LessonSlide[]) ?? [],
      })) as Lesson[];
    },
  });

  const { data: quiz } = useQuery({
    queryKey: ['admin-preview-quiz', courseId],
    enabled: !!isAdmin && !!courseId,
    queryFn: async (): Promise<Quiz | null> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...(data as unknown as Quiz),
        questions: (data.questions as unknown as QuizQuestion[]) ?? [],
      };
    },
  });

  const lessonsByChapter = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const key = (l as unknown as { chapter_id: string | null }).chapter_id ?? '';
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [lessons]);

  const lessonTitleById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of lessons) m[l.id] = l.title;
    return m;
  }, [lessons]);

  const activeLesson =
    view.kind === 'lesson' ? lessons.find((l) => l.id === view.lessonId) ?? null : null;

  if (roleLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const isLoading = courseLoading || chaptersLoading || lessonsLoading;

  return (
    <div>
      <div className="bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-900 dark:text-yellow-200 text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
        <Eye className="h-4 w-4" />
        PREVIEW MODE — This is how students will see this course. No progress is tracked.
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (view.kind !== 'overview') setView({ kind: 'overview' });
              else navigate(`/admin/content/course/${courseId}`);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {view.kind === 'overview' ? 'Back to Editor' : 'Back to Course Overview'}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!isLoading && !course && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Course not found.
            </CardContent>
          </Card>
        )}

        {!isLoading && course && view.kind === 'overview' && (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <Badge variant="outline">{course.tier_required}</Badge>
                {!course.is_published && <Badge variant="secondary">Draft</Badge>}
              </div>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Chapters</h2>
              {chapters.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                    No chapters yet.
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="multiple" defaultValue={chapters.map((c) => c.id)} className="space-y-2">
                  {chapters.map((ch, idx) => {
                    const chLessons = lessonsByChapter.get(ch.id) ?? [];
                    return (
                      <AccordionItem key={ch.id} value={ch.id} className="border rounded-md px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <span className="text-sm text-muted-foreground">Chapter {idx + 1}</span>
                            <span className="font-medium">{ch.title}</span>
                            <Badge variant="secondary" className="ml-2">
                              {chLessons.length} {chLessons.length === 1 ? 'lesson' : 'lessons'}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {ch.description && (
                            <p className="text-sm text-muted-foreground mb-3">{ch.description}</p>
                          )}
                          {chLessons.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No lessons in this chapter.</p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {chLessons.map((l) => (
                                <li key={l.id}>
                                  <button
                                    type="button"
                                    onClick={() => setView({ kind: 'lesson', lessonId: l.id })}
                                    className="group w-full flex items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-sm text-left transition-colors hover:bg-accent hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <span className="truncate font-medium">{l.title}</span>
                                      {!l.is_published && (
                                        <Badge variant="outline" className="text-[10px] ml-1">Draft</Badge>
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground shrink-0">
                                      Open lesson
                                      <ChevronRight className="h-4 w-4" />
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>

            {quiz && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileQuestion className="h-4 w-4" />
                    Course Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {quiz.questions.length} questions · Pass at {quiz.pass_threshold}%
                    </p>
                  </div>
                  <Button onClick={() => setView({ kind: 'quiz' })}>Preview Quiz</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isLoading && course && view.kind === 'lesson' && (
          <LessonRenderer
            lesson={activeLesson}
            onComplete={() => setView({ kind: 'overview' })}
          />
        )}

        {!isLoading && course && view.kind === 'quiz' && quiz && (
          <QuizRunner
            quiz={quiz}
            previewMode
            lessonTitleById={lessonTitleById}
            onContinue={() => setView({ kind: 'overview' })}
            onBackToFoundation={() => setView({ kind: 'overview' })}
          />
        )}
      </div>
    </div>
  );
}
