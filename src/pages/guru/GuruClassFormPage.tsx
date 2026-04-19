import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruClasses } from '@/hooks/useGuruClasses';
import type { ClassFormData, ClassStatus } from '@/types/guru';

const DEFAULT_FORM: ClassFormData = {
  name: '',
  description: '',
  price_monthly: 0,
  win_rate_gate: 70,
  max_students: null,
  status: 'draft',
};

const TIPS = [
  {
    title: 'Pricing tip',
    body: 'Most successful classes charge $49–$149/mo. Start lower to build reviews.',
  },
  {
    title: 'Win rate gate',
    body: 'The default 70% ensures only students demonstrating real skill can progress. You can lower this for beginner classes.',
  },
  {
    title: 'Draft vs Active',
    body: 'Keep your class in Draft while you build out content. Set to Active when ready for enrollment.',
  },
];

export default function GuruClassFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNew = location.pathname.endsWith('/new') || id === 'new' || !id;
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { classes, isLoading: loadingClasses, createClass, updateClass } =
    useGuruClasses();

  const existingClass = useMemo(
    () => (isNew ? null : classes.find((c) => c.id === id) ?? null),
    [isNew, classes, id],
  );

  const [form, setForm] = useState<ClassFormData>(DEFAULT_FORM);
  const [originalStatus, setOriginalStatus] = useState<ClassStatus>('draft');

  useEffect(() => {
    if (!isNew && existingClass) {
      setForm({
        name: existingClass.name,
        description: existingClass.description ?? '',
        price_monthly: Number(existingClass.price_monthly),
        win_rate_gate: existingClass.win_rate_gate,
        max_students: existingClass.max_students,
        status: existingClass.status,
      });
      setOriginalStatus(existingClass.status);
    }
  }, [isNew, existingClass]);

  if (loadingProfile) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  if (!guruProfile || guruProfile.status !== 'active') {
    return <Navigate to="/guru" replace />;
  }

  if (!isNew && !loadingClasses && !existingClass) {
    return <Navigate to="/guru/classes" replace />;
  }

  const isLoading = !isNew && loadingClasses;
  const pending = createClass.isPending || updateClass.isPending;
  const showStatusWarning =
    !isNew && originalStatus === 'active' && form.status !== 'active';

  const nameValid = form.name.trim().length >= 3;
  const priceValid = form.price_monthly >= 0 && form.price_monthly <= 9999;
  const gateValid = form.win_rate_gate >= 0 && form.win_rate_gate <= 100;
  const descValid = form.description.length <= 500;
  const maxValid = form.max_students == null || form.max_students >= 1;
  const formValid = nameValid && priceValid && gateValid && descValid && maxValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    try {
      if (isNew) {
        await createClass.mutateAsync(form);
        toast.success('Class created');
        navigate('/guru/classes');
      } else if (id) {
        await updateClass.mutateAsync({ id, data: form });
        toast.success('Changes saved');
        setOriginalStatus(form.status);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <GuruLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            to="/guru/classes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {isNew ? 'New Class' : 'Edit Class'}
          </h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Class name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. ORB Mastery — April 2026"
                      required
                    />
                    {!nameValid && form.name.length > 0 && (
                      <p className="text-xs text-destructive">
                        Name must be at least 3 characters.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      maxLength={500}
                      rows={4}
                    />
                    <div className="flex justify-end text-xs text-muted-foreground">
                      {form.description.length}/500
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="price">Monthly price</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="price"
                          type="number"
                          min={0}
                          max={9999}
                          step="0.01"
                          value={form.price_monthly}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              price_monthly: Number(e.target.value) || 0,
                            })
                          }
                          className="pl-7 pr-12"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      {form.price_monthly === 0 && (
                        <p className="text-xs text-muted-foreground">Free</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gate">Win rate gate</Label>
                      <div className="relative">
                        <Input
                          id="gate"
                          type="number"
                          min={0}
                          max={100}
                          value={form.win_rate_gate}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              win_rate_gate: Number(e.target.value) || 0,
                            })
                          }
                          className="pr-8"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum win rate required for student progression
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="max">Max students</Label>
                      <Input
                        id="max"
                        type="number"
                        min={1}
                        value={form.max_students ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            max_students: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        placeholder="Unlimited"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank for unlimited enrollment
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm({ ...form, status: v as ClassStatus })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {showStatusWarning && (
                    <div className="flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-medium">
                          Changing status from Active will affect enrolled students.
                        </p>
                        <p className="mt-1 text-amber-200/80">
                          New students will no longer be able to enroll. Existing
                          students will retain access until their subscription period
                          ends.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate('/guru/classes')}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={pending || !formValid}
                      className="bg-amber-500 text-amber-950 hover:bg-amber-400"
                    >
                      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isNew ? 'Create Class' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {TIPS.map((t) => (
                <Card key={t.title}>
                  <CardContent className="space-y-1 p-4">
                    <h3 className="text-sm font-semibold">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
