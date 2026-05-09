import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

type ChapterMin = { id: string; title: string; display_order: number };
type CourseMin = { id: string; title: string; chapters: ChapterMin[] | null };

function extractMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return fallback;
}

export default function AdminChapterFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const courseQuery = useQuery({
    queryKey: ['admin-content-course-min', courseId],
    enabled: isAdmin && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, chapters ( id, title, display_order )')
        .eq('id', courseId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CourseMin | null;
    },
  });

  const chapters = useMemo(
    () => (courseQuery.data?.chapters ?? []).slice().sort((a, b) => a.display_order - b.display_order),
    [courseQuery.data],
  );
  const nextOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.display_order)) + 1 : 1;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveOrder = order ?? nextOrder;
  const totalAfter = chapters.length + 1;

  // Build placement preview list with the new chapter inserted at effectiveOrder.
  const previewRows = useMemo(() => {
    const rows: Array<{ id: string; title: string; isNew: boolean; position: number }> = [];
    const sorted = chapters.slice();
    let inserted = false;
    let pos = 1;
    for (const c of sorted) {
      if (!inserted && effectiveOrder <= c.display_order) {
        rows.push({ id: '__new__', title: title.trim() || 'New chapter', isNew: true, position: pos++ });
        inserted = true;
      }
      rows.push({ id: c.id, title: c.title, isNew: false, position: pos++ });
    }
    if (!inserted) {
      rows.push({ id: '__new__', title: title.trim() || 'New chapter', isNew: true, position: pos++ });
    }
    return rows;
  }, [chapters, effectiveOrder, title]);

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  async function save() {
    if (!courseId) return;
    if (!title.trim()) { toast.error('Title is required'); return; }
    const insertOrder = Math.max(1, Math.min(effectiveOrder, totalAfter));
    setBusy(true);
    try {
      // Step 1: shift down siblings at or after the chosen position (skip if appending at end)
      if (insertOrder <= chapters.length) {
        const toShift = chapters.filter((c) => c.display_order >= insertOrder);
        // Update from largest to smallest to avoid transient duplicates
        const ordered = toShift.slice().sort((a, b) => b.display_order - a.display_order);
        for (const row of ordered) {
          const { error } = await supabase
            .from('chapters')
            .update({ display_order: row.display_order + 1 })
            .eq('id', row.id);
          if (error) throw error;
        }
      }

      // Step 2: insert the new chapter
      const { error: insertErr } = await supabase.from('chapters').insert({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        display_order: insertOrder,
      });
      if (insertErr) throw insertErr;

      qc.invalidateQueries({ queryKey: ['admin-content-course', courseId] });
      qc.invalidateQueries({ queryKey: ['admin-content-course-min', courseId] });
      toast.success('Chapter added.');
      navigate(`/admin/content/course/${courseId}`);
    } catch (e: unknown) {
      console.error('Chapter create error:', e);
      toast.error(extractMessage(e, 'Failed to add chapter'));
    } finally {
      setBusy(false);
    }
  }

  const course = courseQuery.data;

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl">
      <Link
        to={courseId ? `/admin/content/course/${courseId}` : '/admin/content'}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> {course?.title ?? 'Course'}
      </Link>

      {courseQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !course ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Course not found.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>New Chapter</CardTitle>
              <CardDescription>{course.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ch-title">Title *</Label>
                <Input
                  id="ch-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Reading the Tape"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-desc">Description</Label>
                <Textarea
                  id="ch-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional summary of what this chapter covers"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5 max-w-[200px]">
                <Label htmlFor="ch-order">Position</Label>
                <Input
                  id="ch-order"
                  type="number"
                  min={1}
                  max={totalAfter}
                  value={effectiveOrder}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setOrder(Number.isFinite(n) && n >= 1 ? Math.min(n, totalAfter) : 1);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  This chapter will appear at position {Math.min(effectiveOrder, totalAfter)} of {totalAfter}.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Placement preview</CardTitle>
              <CardDescription>How chapters will be ordered after saving.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1.5">
                {previewRows.map((r) => (
                  <li
                    key={`${r.id}-${r.position}`}
                    className={
                      'flex items-center gap-3 rounded-md border px-3 py-2 text-sm ' +
                      (r.isNew
                        ? 'border-primary/60 bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground')
                    }
                  >
                    <span className="tabular-nums w-6 text-right">{r.position}.</span>
                    <span className={r.isNew ? 'font-medium' : ''}>{r.title}</span>
                    {r.isNew && (
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-primary">New</span>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/content/course/${courseId}`)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={busy || !title.trim()}>
              <Save className="h-4 w-4 mr-1" /> Create Chapter
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
