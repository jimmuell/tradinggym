import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Save,
  Send,
  FileUp,
} from 'lucide-react';
import { toast } from 'sonner';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LessonRenderer from '@/components/learning/LessonRenderer';
import SlideImportDialog from '@/components/guru/SlideImportDialog';
import { useGuruClasses } from '@/hooks/useGuruClasses';
import {
  useGuruLesson,
  useSaveGuruLesson,
  useDeleteGuruLesson,
} from '@/hooks/useGuruLessons';
import {
  useGuruQuizByLesson,
  useSaveGuruQuiz,
  useDeleteGuruQuiz,
} from '@/hooks/useGuruQuizzes';
import type { Lesson, LessonSlide } from '@/hooks/useLessons';
import type { QuizQuestion } from '@/hooks/useQuizzes';

const LETTERS = ['A', 'B', 'C', 'D'];

function newSlide(): LessonSlide {
  return {
    id: crypto.randomUUID(),
    title: '',
    body: '',
    bullet_points: [],
    tip: '',
  };
}

function newQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    explanation: '',
  };
}

export default function GuruLessonFormPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const isNew = !lessonId || lessonId === 'new';

  const { classes, isLoading: classesLoading } = useGuruClasses();
  const { data: existingLesson, isLoading: lessonLoading } = useGuruLesson(
    isNew ? undefined : lessonId,
  );
  const { data: existingQuiz, isLoading: quizLoading } = useGuruQuizByLesson(
    isNew ? undefined : lessonId,
  );

  const saveLesson = useSaveGuruLesson();
  const deleteLesson = useDeleteGuruLesson();
  const saveQuiz = useSaveGuruQuiz();
  const deleteQuiz = useDeleteGuruQuiz();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [slides, setSlides] = useState<LessonSlide[]>([newSlide()]);

  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [passThreshold, setPassThreshold] = useState(80);
  const [questions, setQuestions] = useState<QuizQuestion[]>([newQuestion()]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteSlide, setConfirmDeleteSlide] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Stable folder id used for storage uploads. For existing lessons use the real id;
  // for new lessons generate one upfront so uploaded files have a permanent home.
  const newLessonFolderRef = useRef<string>(crypto.randomUUID());
  const lessonFolderId = existingLesson?.id ?? newLessonFolderRef.current;

  useEffect(() => {
    if (existingLesson) {
      setTitle(existingLesson.title);
      setDescription(existingLesson.description ?? '');
      setClassId(existingLesson.class_id ?? '');
      setEstimatedMinutes(existingLesson.estimated_minutes ?? 10);
      setSlides(
        existingLesson.slides.length > 0 ? existingLesson.slides : [newSlide()],
      );
    }
  }, [existingLesson]);

  useEffect(() => {
    if (existingQuiz) {
      setQuizEnabled(true);
      setQuizTitle(existingQuiz.title);
      setPassThreshold(existingQuiz.pass_threshold);
      setQuestions(
        existingQuiz.questions.length > 0 ? existingQuiz.questions : [newQuestion()],
      );
    }
  }, [existingQuiz]);

  const previewLesson: Lesson = useMemo(
    () => ({
      id: existingLesson?.id ?? 'preview',
      title: title || 'Untitled lesson',
      description,
      module: 'guru_custom',
      module_order: 0,
      tier_required: 'foundation',
      content_type: 'guru',
      author_id: null,
      class_id: classId || null,
      slides,
      estimated_minutes: estimatedMinutes,
      is_published: false,
      created_at: '',
      updated_at: '',
    }),
    [existingLesson, title, description, classId, slides, estimatedMinutes],
  );

  function validate(): string | null {
    if (!title.trim()) return 'Title is required';
    if (!classId) return 'Please select a class';
    for (const s of slides) {
      if (!s.title.trim()) return 'Every slide needs a title';
    }
    if (quizEnabled) {
      if (!quizTitle.trim()) return 'Quiz title is required';
      for (const q of questions) {
        if (!q.question.trim()) return 'Every question needs text';
        if (q.options.some((o) => !o.trim())) return 'All four answer options are required';
        if (!q.explanation.trim()) return 'Every question needs an explanation';
      }
    }
    return null;
  }

  async function handleSave(publish: boolean) {
    console.log('GuruLessonFormPage.handleSave called', {
      publish,
      existingLessonId: existingLesson?.id ?? null,
      classId,
      title,
      estimatedMinutes,
      slideCount: slides.length,
      quizEnabled,
    });

    const err = validate();
    if (err) {
      console.warn('GuruLessonFormPage.handleSave validation failed:', err);
      toast.error(err);
      return;
    }

    try {
      console.log('GuruLessonFormPage.handleSave starting lesson mutation');
      const lesson = await saveLesson.mutateAsync({
        id: existingLesson?.id,
        title: title.trim(),
        description: description.trim() || null,
        class_id: classId,
        estimated_minutes: estimatedMinutes,
        is_published: publish,
        slides,
      });

      console.log('GuruLessonFormPage.handleSave lesson mutation succeeded', {
        lessonId: lesson.id,
      });

      if (quizEnabled) {
        console.log('GuruLessonFormPage.handleSave starting quiz mutation');
        await saveQuiz.mutateAsync({
          id: existingQuiz?.id,
          lesson_id: lesson.id,
          title: quizTitle.trim(),
          pass_threshold: passThreshold,
          questions,
        });
        console.log('GuruLessonFormPage.handleSave quiz mutation succeeded');
      } else if (existingQuiz) {
        console.log('GuruLessonFormPage.handleSave deleting existing quiz');
        await deleteQuiz.mutateAsync(existingQuiz.id);
        console.log('GuruLessonFormPage.handleSave existing quiz deleted');
      }

      toast.success(
        publish
          ? 'Lesson published — students can now access it.'
          : 'Lesson saved as draft.',
      );
      navigate('/guru/lessons');
    } catch (e) {
      console.error('GuruLessonFormPage.handleSave failed:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to save lesson');
    }
  }

  async function handleDelete() {
    if (!existingLesson) return;
    try {
      await deleteLesson.mutateAsync(existingLesson.id);
      toast.success('Lesson deleted');
      navigate('/guru/lessons');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete lesson');
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

  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === optIdx ? value : o)) }
          : q,
      ),
    );
  }

  if (!isNew && (lessonLoading || quizLoading)) {
    return (
      <GuruLayout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </GuruLayout>
    );
  }

  const saving = saveLesson.isPending || saveQuiz.isPending || deleteQuiz.isPending;

  return (
    <GuruLayout>
      <div className="space-y-6 max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/guru/lessons')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Lessons
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? 'Create Lesson' : 'Edit Lesson'}
          </h1>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>

        {/* Lesson metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lesson Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Reading the Order Flow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Short summary (max 200 chars)"
                maxLength={200}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={classId} onValueChange={setClassId} disabled={classesLoading}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Estimated time (min)</Label>
                <Input
                  id="time"
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 10)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slides */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Slides</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setSlides((p) => [...p, newSlide()])}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slide
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {slides.map((slide, idx) => (
              <Collapsible key={slide.id} defaultOpen={idx === slides.length - 1}>
                <div className="rounded-md border border-border">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <CollapsibleTrigger className="flex-1 text-left text-sm font-medium hover:text-primary">
                      Slide {idx + 1}: {slide.title || 'Untitled'}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => moveSlide(idx, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === slides.length - 1}
                        onClick={() => moveSlide(idx, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={slides.length <= 1}
                        onClick={() => setConfirmDeleteSlide(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-3 border-t border-border p-3">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={slide.title}
                          onChange={(e) => updateSlide(idx, { title: e.target.value })}
                          placeholder="Slide heading"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                          value={slide.body}
                          onChange={(e) => updateSlide(idx, { body: e.target.value })}
                          placeholder="Use **bold** and *italic* for emphasis"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bullet points</Label>
                        {(slide.bullet_points ?? []).map((bp, bIdx) => (
                          <div key={bIdx} className="flex gap-2">
                            <Input
                              value={bp}
                              onChange={(e) => {
                                const next = [...(slide.bullet_points ?? [])];
                                next[bIdx] = e.target.value;
                                updateSlide(idx, { bullet_points: next });
                              }}
                              placeholder={`Bullet ${bIdx + 1}`}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0"
                              onClick={() => {
                                const next = (slide.bullet_points ?? []).filter(
                                  (_, j) => j !== bIdx,
                                );
                                updateSlide(idx, { bullet_points: next });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateSlide(idx, {
                              bullet_points: [...(slide.bullet_points ?? []), ''],
                            })
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add bullet
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Tip</Label>
                        <Input
                          value={slide.tip ?? ''}
                          onChange={(e) => updateSlide(idx, { tip: e.target.value })}
                          placeholder="Add a practical tip for students"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Quiz</CardTitle>
              <p className="text-xs text-muted-foreground">
                Include a quiz with this lesson
              </p>
            </div>
            <Switch checked={quizEnabled} onCheckedChange={setQuizEnabled} />
          </CardHeader>
          {quizEnabled && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quiz title</Label>
                  <Input
                    value={quizTitle || `Quiz: ${title}`}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pass threshold (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(Number(e.target.value) || 80)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="rounded-md border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Question {qIdx + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={questions.length <= 1}
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                      placeholder="Question text"
                      rows={2}
                    />
                    <RadioGroup
                      value={String(q.correct_index)}
                      onValueChange={(v) => updateQuestion(qIdx, { correct_index: Number(v) })}
                      className="space-y-2"
                    >
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <RadioGroupItem value={String(optIdx)} id={`${q.id}-${optIdx}`} />
                          <Label
                            htmlFor={`${q.id}-${optIdx}`}
                            className="text-xs w-5 shrink-0"
                          >
                            {LETTERS[optIdx]}
                          </Label>
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${LETTERS[optIdx]}`}
                          />
                        </div>
                      ))}
                    </RadioGroup>
                    <Textarea
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                      placeholder="Explanation (shown after answering)"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuestions((p) => [...p, newQuestion()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {!isNew && (
              <Button
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={saving || deleteLesson.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Lesson
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson Preview</DialogTitle>
          </DialogHeader>
          <LessonRenderer lesson={previewLesson} onComplete={() => setPreviewOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete lesson confirmation */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the lesson and any linked quiz. Students will lose access
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete slide confirmation */}
      <AlertDialog
        open={confirmDeleteSlide !== null}
        onOpenChange={(o) => !o && setConfirmDeleteSlide(null)}
      >
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
              onClick={() => confirmDeleteSlide !== null && deleteSlide(confirmDeleteSlide)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GuruLayout>
  );
}
