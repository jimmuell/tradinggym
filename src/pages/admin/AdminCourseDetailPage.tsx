import { useState } from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Plus, ChevronDown, ChevronRight, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation',
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
};

type LessonRow = {
  id: string;
  title: string;
  module_order: number;
  slides: unknown;
  estimated_minutes: number | null;
  is_published: boolean | null;
  updated_at: string;
};

type ChapterRow = {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  lessons: LessonRow[] | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
  tier_required: string;
  display_order: number;
  is_published: boolean | null;
  updated_at: string;
  chapters: ChapterRow[] | null;
};

type CourseQuiz = {
  id: string;
  title: string;
  pass_threshold: number;
  is_published: boolean | null;
  questions: unknown;
};

function PublishedBadge({ published }: { published: boolean | null }) {
  return published ? (
    <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20 border-green-500/30">Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}

function ChapterBlock({ chapter }: { chapter: ChapterRow }) {
  const [open, setOpen] = useState(true);
  const lessons = (chapter.lessons ?? []).slice().sort((a, b) => a.module_order - b.module_order);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">Chapter {chapter.display_order}</span>
                <span className="font-semibold">{chapter.title}</span>
              </div>
              {chapter.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{chapter.description}</p>
              )}
            </div>
            <Badge variant="outline">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</Badge>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t overflow-x-auto">
            {lessons.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No lessons in this chapter yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Slides</TableHead>
                    <TableHead className="text-right">Est. Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((l) => {
                    const slideCount = Array.isArray(l.slides) ? l.slides.length : 0;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{l.module_order}</TableCell>
                        <TableCell className="font-medium">{l.title}</TableCell>
                        <TableCell className="text-right tabular-nums">{slideCount}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l.estimated_minutes != null ? `${l.estimated_minutes} min` : '—'}
                        </TableCell>
                        <TableCell><PublishedBadge published={l.is_published} /></TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/content/lesson/${l.id}`}>Edit</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <div className="p-3 border-t bg-muted/20 flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button size="sm" variant="ghost" disabled>
                      <Plus className="h-4 w-4" /> Add Lesson
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming in CC-2</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const courseQuery = useQuery({
    queryKey: ['admin-content-course', courseId],
    enabled: isAdmin && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id, title, description, tier_required, display_order, is_published, updated_at,
          chapters (
            id, title, description, display_order,
            lessons:lessons ( id, title, module_order, slides, estimated_minutes, is_published, updated_at )
          )
        `)
        .eq('id', courseId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CourseDetail | null;
    },
  });

  const quizQuery = useQuery({
    queryKey: ['admin-content-course-quiz', courseId],
    enabled: isAdmin && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, pass_threshold, is_published, questions')
        .eq('course_id', courseId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data as CourseQuiz | null;
    },
  });

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const course = courseQuery.data;
  const chapters = (course?.chapters ?? []).slice().sort((a, b) => a.display_order - b.display_order);

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 md:p-6">
        <Link to="/admin/content" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Content Manager
        </Link>

        {courseQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !course ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Course not found.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" /> {course.title}
                    </CardTitle>
                    {course.description && (
                      <CardDescription>{course.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TIER_LABELS[course.tier_required] ?? course.tier_required}</Badge>
                    <PublishedBadge published={course.is_published} />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chapters</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button size="sm" disabled>
                      <Plus className="h-4 w-4" /> Add Chapter
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming in CC-2</TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-3">
              {chapters.length === 0 ? (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">No chapters yet.</CardContent></Card>
              ) : (
                chapters.map((ch) => <ChapterBlock key={ch.id} chapter={ch} />)
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Quiz</h2>
              {quizQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !quizQuery.data ? (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">No quiz linked to this course.</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileQuestion className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{quizQuery.data.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {Array.isArray(quizQuery.data.questions) ? quizQuery.data.questions.length : 0} questions · pass {quizQuery.data.pass_threshold}%
                        </div>
                      </div>
                      <PublishedBadge published={quizQuery.data.is_published} />
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/content/quiz/${quizQuery.data.id}`}>Edit Quiz</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
