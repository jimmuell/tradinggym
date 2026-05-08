import { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const TIER_OPTIONS = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'tier1', label: 'Tier 1 — Price Action' },
  { value: 'tier2', label: 'Tier 2 — Confirmation' },
  { value: 'tier3', label: 'Tier 3 — Institutional' },
];

function extractMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}

export default function AdminCourseFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const isNew = !courseId || courseId === 'new';

  const { data: existing, isLoading: courseLoading } = useQuery({
    queryKey: ['admin-content-course', courseId],
    enabled: !!isAdmin && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, tier_required, display_order, is_published')
        .eq('id', courseId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: orderHint } = useQuery({
    queryKey: ['admin-content-courses-orders'],
    enabled: !!isAdmin && isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('display_order')
        .eq('content_type', 'platform');
      if (error) throw error;
      const max = (data ?? []).reduce((m, r) => Math.max(m, r.display_order ?? 0), 0);
      return max + 1;
    },
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tierRequired, setTierRequired] = useState<string>('foundation');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setTierRequired(existing.tier_required);
      setDisplayOrder(existing.display_order ?? 1);
      setIsPublished(!!existing.is_published);
    }
  }, [existing]);

  useEffect(() => {
    if (isNew && orderHint) setDisplayOrder(orderHint);
  }, [isNew, orderHint]);

  function validate(): string | null {
    if (!title.trim()) return 'Title is required';
    if (!tierRequired) return 'Tier is required';
    if (!displayOrder || displayOrder < 1) return 'Display order must be 1 or greater';
    if (description.length > 500) return 'Description must be 500 characters or less';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      if (existing?.id) {
        const { error } = await supabase
          .from('courses')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            tier_required: tierRequired,
            display_order: displayOrder,
            is_published: isPublished,
          })
          .eq('id', existing.id);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ['admin-content-courses'] });
        qc.invalidateQueries({ queryKey: ['admin-content-course', existing.id] });
        toast.success('Course updated.');
        navigate(`/admin/content/course/${existing.id}`);
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            tier_required: tierRequired,
            display_order: displayOrder,
            is_published: isPublished,
            content_type: 'platform',
            author_id: null,
            class_id: null,
          })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ['admin-content-courses'] });
        toast.success('Course created.');
        if (data?.id) navigate(`/admin/content/course/${data.id}`);
        else navigate('/admin/content');
      }
    } catch (e: unknown) {
      console.error('Admin course save error:', e);
      toast.error(extractMessage(e, 'Failed to save course'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', existing.id)
        .eq('content_type', 'platform');
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-content-courses'] });
      toast.success('Course deleted.');
      navigate('/admin/content');
    } catch (e: unknown) {
      console.error('Admin course delete error:', e);
      toast.error(extractMessage(e, 'Failed to delete course'));
    } finally {
      setSaving(false);
    }
  }

  if (roleLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (!isNew && courseLoading) {
    return (
      <div className="space-y-4 max-w-3xl p-4 md:p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl p-4 md:p-6">
      <Link to="/admin/content" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Content Manager
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">
        {isNew ? 'Create Course' : 'Edit Course'}
      </h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Course Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Foundation — Trading Literacy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc" value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Short summary (max 500 chars)" rows={3}
            />
            <p className="text-[11px] text-muted-foreground">{description.length}/500</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="tier">Tier Required *</Label>
              <Select value={tierRequired} onValueChange={setTierRequired}>
                <SelectTrigger id="tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Display Order *</Label>
              <Input id="order" type="number" min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="pub" className="text-sm">Published</Label>
              <p className="text-xs text-muted-foreground">Students can only see published courses.</p>
            </div>
            <Switch id="pub" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isNew && (
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-1" />Delete Course
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{isNew ? 'Create Course' : 'Save Changes'}
        </Button>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the course, all its chapters, all lessons within those chapters, and any linked quiz. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
