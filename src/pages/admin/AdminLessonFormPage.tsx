import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Eye, Save, Send, FileUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LessonRenderer from '@/components/learning/LessonRenderer';
import SlideImportDialog from '@/components/guru/SlideImportDialog';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import type { Lesson, LessonSlide } from '@/hooks/useLessons';

const MODULE_OPTIONS = [
  { value: 'f1_candles', label: 'F1 — Reading Candles', tier: 'foundation' },
  { value: 'f2_structure', label: 'F2 — Market Structure', tier: 'foundation' },
  { value: 'f3_sessions', label: 'F3 — Sessions & Time', tier: 'foundation' },
  { value: 'f4_risk', label: 'F4 — Risk Management', tier: 'foundation' },
  { value: 'f5_plan', label: 'F5 — Your Trading Plan', tier: 'foundation' },
  { value: 'tier1_orb', label: 'Tier 1 — Price Action (ORB)', tier: 'tier1' },
  { value: 'tier2_vwap', label: 'Tier 2 — Confirmation (VWAP)', tier: 'tier2' },
  { value: 'tier3_amd', label: 'Tier 3 — Institutional (AMD)', tier: 'tier3' },
];

function newSlide(): LessonSlide {
  return { id: crypto.randomUUID(), title: '', body: '', bullet_points: [], tip: '' };
}

export default function AdminLessonFormPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const isNew = !lessonId || lessonId === 'new';

  const { data: existingLesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['admin-lesson', lessonId],
    enabled: !!isAdmin && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data
        ? { ...data, slides: ((data.slides as unknown as LessonSlide[]) ?? []) }
        : null;
    },
  });

  // For module_order default on new lessons
  const { data: moduleCounts } = useQuery({
    queryKey: ['admin-lesson-module-counts'],
    enabled: !!isAdmin && isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('module')
        .eq('content_type', 'platform');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[r.module] = (counts[r.module] ?? 0) + 1;
      return counts;
    },
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<string>('');
  const [moduleOrder, setModuleOrder] = useState<number>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [slides, setSlides] = useState<LessonSlide[]>([newSlide()]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteSlide, setConfirmDeleteSlide] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const newLessonFolderRef = useRef<string>(crypto.randomUUID());
  const lessonFolderId = existingLesson?.id ?? newLessonFolderRef.current;

  useEffect(() => {
    if (existingLesson) {
      setTitle(existingLesson.title);
      setDescription(existingLesson.description ?? '');
      setModule(existingLesson.module);
      setModuleOrder(existingLesson.module_order ?? 1);
      setEstimatedMinutes(existingLesson.estimated_minutes ?? 10);
      setSlides(existingLesson.slides.length > 0 ? existingLesson.slides : [newSlide()]);
    }
  }, [existingLesson]);

  // Auto-update module_order suggestion when module changes (new lessons only)
  useEffect(() => {
    if (isNew && module && moduleCounts) {
      setModuleOrder((moduleCounts[module] ?? 0) + 1);
    }
  }, [isNew, module, moduleCounts]);

  const tierRequired = useMemo(
    () => MODULE_OPTIONS.find((m) => m.value === module)?.tier ?? 'foundation',
    [module],
  );

  const previewLesson: Lesson = useMemo(
    () => ({
      id: existingLesson?.id ?? 'preview',
      title: title || 'Untitled lesson',
      description,
      module: module || 'preview',
      module_order: moduleOrder,
      tier_required: tierRequired,
      content_type: 'platform',
      author_id: null,
      class_id: null,
      slides,
      estimated_minutes: estimatedMinutes,
      is_published: false,
      created_at: '',
      updated_at: '',
    }),
    [existingLesson, title, description, module, moduleOrder, tierRequired, slides, estimatedMinutes],
  );

  function validate(): string | null {
    if (!title.trim()) return 'Title is required';
    if (!module) return 'Please select a module';
    if (!moduleOrder || moduleOrder < 1) return 'Module order must be 1 or greater';
    for (const s of slides) {
      if (!s.title.trim()) return 'Every slide needs a title';
    }
    return null;
  }

  async function handleSave(publish: boolean) {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const row = {
        title: title.trim(),
        description: description.trim() || null,
        module,
        module_order: moduleOrder,
        tier_required: tierRequired,
        estimated_minutes: estimatedMinutes,
        is_published: publish,
        slides: slides as unknown as never,
        content_type: 'platform',
        author_id: null,
        class_id: null,
      };
      if (existingLesson?.id) {
        const { error } = await supabase
          .from('lessons').update(row)
          .eq('id', existingLesson.id).eq('content_type', 'platform');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lessons').insert(row);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['admin-content-lessons'] });
      qc.invalidateQueries({ queryKey: ['admin-lesson', lessonId] });
      toast.success(publish ? 'Lesson published.' : 'Lesson saved as draft.');
      navigate('/admin/content');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingLesson) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('lessons')
        .delete().eq('id', existingLesson.id).eq('content_type', 'platform');
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-content-lessons'] });
      toast.success('Lesson deleted');
      navigate('/admin/content');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete lesson');
    } finally {
      setSaving(false);
    }
  }

  function updateSlide(idx: number, patch: Partial<LessonSlide>) {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function moveSlide(idx: number, dir: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function deleteSlide(idx: number) {
    setSlides((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
    setConfirmDeleteSlide(null);
  }

  if (roleLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (!isNew && lessonLoading) {
    return (
      <div className="space-y-4 max-w-3xl p-4 md:p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl p-4 md:p-6">
      <button
        type="button"
        onClick={() => navigate('/admin/content')}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Content Manager
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? 'Create Platform Lesson' : 'Edit Platform Lesson'}
        </h1>
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lesson Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label htmlFor="module">Module *</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger id="module"><SelectValue placeholder="Select a module" /></SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {module && (
                <p className="text-[11px] text-muted-foreground">
                  Tier required: <span className="font-mono">{tierRequired}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Order *</Label>
              <Input
                id="order" type="number" min={1}
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Reading the Order Flow" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description" value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Short summary (max 200 chars)" maxLength={200}
            />
          </div>
          <div className="space-y-2 max-w-[220px]">
            <Label htmlFor="time">Estimated time (min)</Label>
            <Input id="time" type="number" min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 10)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Slides</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4 mr-1" />Import Slides
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSlides((p) => [...p, newSlide()])}>
              <Plus className="h-4 w-4 mr-1" />Add Slide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {slides.map((slide, idx) => {
            const isImported = slide.type === 'imported' || !!slide.image_url;
            return (
              <Collapsible key={slide.id} defaultOpen={idx === slides.length - 1}>
                <div className="rounded-md border border-border">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <CollapsibleTrigger className="flex-1 text-left text-sm font-medium hover:text-primary">
                      Slide {idx + 1}: {slide.title || 'Untitled'}
                      {isImported && <span className="ml-2 text-xs text-muted-foreground">(imported)</span>}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        disabled={idx === 0} onClick={() => moveSlide(idx, -1)}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        disabled={idx === slides.length - 1} onClick={() => moveSlide(idx, 1)}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={slides.length <= 1}
                        onClick={() => setConfirmDeleteSlide(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-3 border-t border-border p-3">
                      {isImported && slide.image_url && (
                        <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
                          <img src={slide.image_url} alt={slide.title || `Slide ${idx + 1}`}
                            className="w-full h-auto max-h-64 object-contain mx-auto" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={slide.title}
                          onChange={(e) => updateSlide(idx, { title: e.target.value })}
                          placeholder="Slide heading" />
                      </div>
                      <div className="space-y-2">
                        <Label>{isImported ? 'Notes (optional)' : 'Body'}</Label>
                        <Textarea value={slide.body}
                          onChange={(e) => updateSlide(idx, { body: e.target.value })}
                          placeholder={isImported ? 'Optional text shown below the slide image' : 'Use **bold** and *italic* for emphasis'}
                          rows={isImported ? 3 : 4} />
                      </div>
                      {!isImported && (
                        <>
                          <div className="space-y-2">
                            <Label>Bullet points</Label>
                            {(slide.bullet_points ?? []).map((bp, bIdx) => (
                              <div key={bIdx} className="flex gap-2">
                                <Input value={bp}
                                  onChange={(e) => {
                                    const next = [...(slide.bullet_points ?? [])];
                                    next[bIdx] = e.target.value;
                                    updateSlide(idx, { bullet_points: next });
                                  }}
                                  placeholder={`Bullet ${bIdx + 1}`} />
                                <Button size="icon" variant="ghost" className="shrink-0"
                                  onClick={() => {
                                    const next = (slide.bullet_points ?? []).filter((_, j) => j !== bIdx);
                                    updateSlide(idx, { bullet_points: next });
                                  }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button size="sm" variant="outline"
                              onClick={() => updateSlide(idx, { bullet_points: [...(slide.bullet_points ?? []), ''] })}>
                              <Plus className="h-3 w-3 mr-1" />Add bullet
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Tip</Label>
                            <Input value={slide.tip ?? ''}
                              onChange={(e) => updateSlide(idx, { tip: e.target.value })}
                              placeholder="Add a practical tip for students" />
                          </div>
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isNew && (
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-1" />Delete Lesson
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="h-4 w-4 mr-1" />Publish
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Lesson Preview</DialogTitle></DialogHeader>
          <LessonRenderer lesson={previewLesson} onComplete={() => setPreviewOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the platform lesson. Students will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteSlide !== null}
        onOpenChange={(o) => !o && setConfirmDeleteSlide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              The slide and its content will be removed from this lesson.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteSlide !== null && deleteSlide(confirmDeleteSlide)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SlideImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        lessonFolderId={lessonFolderId}
        onImported={(imported) =>
          setSlides((prev) => {
            const isDefaultPlaceholder =
              prev.length === 1 && !prev[0].title.trim() && !prev[0].body.trim() &&
              !prev[0].image_url && (prev[0].bullet_points ?? []).length === 0 && !prev[0].tip;
            return isDefaultPlaceholder ? imported : [...prev, ...imported];
          })
        }
      />
    </div>
  );
}
