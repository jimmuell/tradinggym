import { useState } from 'react';
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, Plus, ChevronDown, ChevronRight, ChevronUp, FileQuestion,
  Pencil, Trash2, Save, X, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

function extractMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}

function PublishedBadge({ published }: { published: boolean | null }) {
  return published ? (
    <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20 border-green-500/30">Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}

function ChapterBlock({
  chapter, courseId, isFirst, isLast, allChapters,
}: {
  chapter: ChapterRow;
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
  allChapters: ChapterRow[];
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [editDesc, setEditDesc] = useState(chapter.description ?? '');
  const [editOrder, setEditOrder] = useState<number>(chapter.display_order);
  const [busy, setBusy] = useState(false);

  const lessons = (chapter.lessons ?? []).slice().sort((a, b) => a.module_order - b.module_order);

  function startEdit() {
    setEditTitle(chapter.title);
    setEditDesc(chapter.description ?? '');
    setEditOrder(chapter.display_order);
    setEditing(true);
  }

  async function saveEdit() {
    if (!editTitle.trim()) { toast.error('Title is required'); return; }
    setBusy(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          display_order: editOrder,
        })
        .eq('id', chapter.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-content-course', courseId] });
      toast.success('Chapter updated.');
      setEditing(false);
    } catch (e: unknown) {
      console.error('Chapter update error:', e);
      toast.error(extractMessage(e, 'Failed to update chapter'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteChapter() {
    setBusy(true);
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapter.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-content-course', courseId] });
      toast.success('Chapter deleted.');
    } catch (e: unknown) {
      console.error('Chapter delete error:', e);
      toast.error(extractMessage(e, 'Failed to delete chapter'));
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function swapWithNeighbor(dir: -1 | 1) {
    const sorted = allChapters.slice().sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((c) => c.id === chapter.id);
    const target = sorted[idx + dir];
    if (!target) return;
    setBusy(true);
    try {
      // Two-step swap (display_order has no unique constraint)
      const { error: e1 } = await supabase
        .from('chapters')
        .update({ display_order: target.display_order })
        .eq('id', chapter.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('chapters')
        .update({ display_order: chapter.display_order })
        .eq('id', target.id);
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ['admin-content-course', courseId] });
    } catch (e: unknown) {
      console.error('Chapter reorder error:', e);
      toast.error(extractMessage(e, 'Failed to reorder'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="w-full p-4 flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </CollapsibleTrigger>

          {editing ? (
            <div className="flex-1 grid gap-2 sm:grid-cols-[80px_1fr_1fr] items-start">
              <div className="space-y-1">
                <Label className="text-[10px]">Order</Label>
                <Input type="number" min={1} value={editOrder}
                  onChange={(e) => setEditOrder(Number(e.target.value) || 1)}
                  className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Description</Label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8" />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">Chapter {chapter.display_order}</span>
                <span className="font-semibold truncate">{chapter.title}</span>
              </div>
              {chapter.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{chapter.description}</p>
              )}
            </div>
          )}

          <Badge variant="outline" className="shrink-0">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</Badge>

          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit} disabled={busy} title="Save">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)} disabled={busy} title="Cancel">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => swapWithNeighbor(-1)} disabled={busy || isFirst} title="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => swapWithNeighbor(1)} disabled={busy || isLast} title="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={startEdit} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

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
              <Button size="sm" variant="ghost"
                onClick={() => navigate(`/admin/content/lesson/new?chapterId=${chapter.id}&courseId=${courseId}`)}>
                <Plus className="h-4 w-4" /> Add Lesson
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              Lessons in this chapter will be unlinked (not deleted) and can be reassigned later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteChapter}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/content/course/${course.id}/preview`}>
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/content/course/${course.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chapters</h2>
            <Button asChild size="sm">
              <Link to={`/admin/content/course/${course.id}/chapter/new`}>
                <Plus className="h-4 w-4" /> Add Chapter
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {chapters.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">No chapters yet.</CardContent></Card>
            ) : (
              chapters.map((ch, idx) => (
                <ChapterBlock
                  key={ch.id}
                  chapter={ch}
                  courseId={course.id}
                  isFirst={idx === 0}
                  isLast={idx === chapters.length - 1}
                  allChapters={chapters}
                />
              ))
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Quiz</h2>
            {quizQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !quizQuery.data ? (
              <Card>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">No quiz linked to this course.</p>
                  <Button asChild size="sm">
                    <Link to={`/admin/content/quiz/new?courseId=${course.id}`}>
                      <Plus className="h-4 w-4" /> Add Quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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
  );
}
