import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import type { QuizQuestion } from '@/hooks/useQuizzes';

const LETTERS = ['A', 'B', 'C', 'D'];

function deriveQuizModule(tierRequired: string): string {
  if (tierRequired === 'foundation') return 'foundation';
  if (tierRequired === 'tier1') return 'tier1_orb';
  if (tierRequired === 'tier2') return 'tier2_vwap';
  if (tierRequired === 'tier3') return 'tier3_amd';
  return 'platform_custom';
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

export default function AdminQuizFormPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const isNew = !quizId || quizId === 'new';

  const { data: existingQuiz, isLoading: quizLoading } = useQuery({
    queryKey: ['admin-quiz', quizId],
    enabled: !!isAdmin && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId!)
        .eq('content_type', 'platform')
        .maybeSingle();
      if (error) throw error;
      return data
        ? { ...data, questions: ((data.questions as unknown as QuizQuestion[]) ?? []) }
        : null;
    },
  });

  const effectiveCourseId = paramCourseId ?? existingQuiz?.course_id ?? null;

  const { data: courseContext } = useQuery({
    queryKey: ['admin-quiz-course-context', effectiveCourseId],
    enabled: !!isAdmin && !!effectiveCourseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, tier_required')
        .eq('id', effectiveCourseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState('');
  const [passThreshold, setPassThreshold] = useState(80);
  const [questions, setQuestions] = useState<QuizQuestion[]>([newQuestion()]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title);
      setPassThreshold(existingQuiz.pass_threshold);
      setQuestions(existingQuiz.questions.length > 0 ? existingQuiz.questions : [newQuestion()]);
    }
  }, [existingQuiz]);

  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === optIdx ? value : o)) } : q,
      ),
    );
  }

  function validate(): string | null {
    if (!title.trim()) return 'Title is required';
    if (passThreshold < 0 || passThreshold > 100) return 'Pass threshold must be 0–100';
    for (const q of questions) {
      if (!q.question.trim()) return 'Every question needs text';
      if (q.options.some((o) => !o.trim())) return 'All four answer options are required';
      if (!q.explanation.trim()) return 'Every question needs an explanation';
    }
    return null;
  }

  function extractMessage(e: unknown, fallback: string): string {
    if (e instanceof Error) return e.message;
    if (e && typeof e === 'object' && 'message' in e) {
      return String((e as { message: unknown }).message);
    }
    return fallback;
  }

  async function handleSave(publish: boolean) {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const questionsJson = JSON.parse(JSON.stringify(questions));
      const tier = courseContext?.tier_required ?? 'foundation';
      const derivedModule = deriveQuizModule(tier);

      if (existingQuiz?.id) {
        const { error } = await supabase
          .from('quizzes')
          .update({
            title: title.trim(),
            pass_threshold: passThreshold,
            questions: questionsJson,
            is_published: publish,
          })
          .eq('id', existingQuiz.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert({
            title: title.trim(),
            module: derivedModule,
            pass_threshold: passThreshold,
            questions: questionsJson,
            is_published: publish,
            content_type: 'platform' as const,
            author_id: null,
            lesson_id: null,
            course_id: effectiveCourseId,
          });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['admin-content-quizzes'] });
      qc.invalidateQueries({ queryKey: ['admin-quiz', quizId] });
      qc.invalidateQueries({ queryKey: ['admin-content-course-quiz', effectiveCourseId] });
      toast.success(publish ? 'Quiz published.' : 'Quiz saved as draft.');
      if (effectiveCourseId) {
        navigate(`/admin/content/course/${effectiveCourseId}`);
      } else {
        navigate('/admin/content');
      }
    } catch (e: unknown) {
      console.error('Admin quiz save error:', e);
      toast.error(extractMessage(e, 'Failed to save quiz'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingQuiz) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('quizzes')
        .delete().eq('id', existingQuiz.id).eq('content_type', 'platform');
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin-content-quizzes'] });
      qc.invalidateQueries({ queryKey: ['admin-content-course-quiz', effectiveCourseId] });
      toast.success('Quiz deleted');
      if (effectiveCourseId) {
        navigate(`/admin/content/course/${effectiveCourseId}`);
      } else {
        navigate('/admin/content');
      }
    } catch (e: unknown) {
      console.error('Admin quiz delete error:', e);
      toast.error(extractMessage(e, 'Failed to delete quiz'));
    } finally {
      setSaving(false);
    }
  }

  const previewQuestions = useMemo(() => questions, [questions]);

  if (roleLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (!isNew && quizLoading) {
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
        onClick={() => {
          if (effectiveCourseId) navigate(`/admin/content/course/${effectiveCourseId}`);
          else navigate('/admin/content');
        }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? 'Create Platform Quiz' : 'Edit Platform Quiz'}
        </h1>
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-1" />Preview
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quiz Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {courseContext && (
            <div className="text-sm text-muted-foreground">
              <Link to="/admin/content" className="hover:text-foreground">Content</Link>
              {' → '}
              <Link to={`/admin/content/course/${courseContext.id}`} className="hover:text-foreground">
                {courseContext.title}
              </Link>
              {' → '}
              <span className="text-foreground font-medium">Quiz</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Foundation Mastery Check" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="pass">Pass threshold (%)</Label>
              <Input id="pass" type="number" min={0} max={100}
                value={passThreshold}
                onChange={(e) => setPassThreshold(Number(e.target.value) || 80)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Questions</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setQuestions((p) => [...p, newQuestion()])}>
            <Plus className="h-4 w-4 mr-1" />Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="rounded-md border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Question {qIdx + 1}</span>
                <Button size="icon" variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={questions.length <= 1}
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                placeholder="Question text" rows={2}
              />
              <RadioGroup
                value={String(q.correct_index)}
                onValueChange={(v) => updateQuestion(qIdx, { correct_index: Number(v) })}
                className="space-y-2"
              >
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <RadioGroupItem value={String(optIdx)} id={`${q.id}-${optIdx}`} />
                    <Label htmlFor={`${q.id}-${optIdx}`} className="text-xs w-5 shrink-0">
                      {LETTERS[optIdx]}
                    </Label>
                    <Input value={opt}
                      onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${LETTERS[optIdx]}`} />
                  </div>
                ))}
              </RadioGroup>
              <Textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                placeholder="Explanation (shown after answering)" rows={2}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isNew && (
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-1" />Delete Quiz
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Quiz Preview</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Pass threshold: <span className="font-medium text-foreground">{passThreshold}%</span>
            </div>
            {previewQuestions.map((q, i) => (
              <div key={q.id} className="rounded-md border border-border p-3 space-y-2">
                <div className="text-sm font-medium">{i + 1}. {q.question || <span className="text-muted-foreground italic">(empty)</span>}</div>
                <ul className="space-y-1 text-sm">
                  {q.options.map((o, oi) => (
                    <li key={oi}
                      className={oi === q.correct_index ? 'text-green-500 font-medium' : 'text-foreground'}>
                      {LETTERS[oi]}. {o || <span className="text-muted-foreground italic">(empty)</span>}
                      {oi === q.correct_index && ' ✓'}
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the platform quiz. Student attempt history is preserved.
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
