import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import { useGuruSessions } from '@/hooks/useGuruSessions';

function toDateInput(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function GuruSessionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { cohorts, isLoading: cohortsLoading } = useGuruCohorts();
  const { sessions, isLoading: sessionsLoading, createSession, updateSession } = useGuruSessions();

  const existing = useMemo(
    () => (isNew ? null : sessions.find((s) => s.id === id) ?? null),
    [isNew, sessions, id],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setCohortId(existing.cohort_id);
      const { date: d, time: t } = toDateInput(existing.scheduled_at);
      setDate(d);
      setTime(t);
    }
  }, [existing]);

  if (profileLoading || (!isNew && sessionsLoading)) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  if (guruProfile?.status !== 'active') return <Navigate to="/guru" replace />;
  if (!isNew && !existing) return <Navigate to="/guru/sessions" replace />;

  const isEnded = existing?.status === 'ended';
  const activeCohorts = cohorts.filter((c) => c.status === 'active');

  if (isEnded && existing) {
    return (
      <GuruLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            to="/guru/sessions"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sessions
          </Link>
          <div>
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border mb-2">
              Ended
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">{existing.title}</h1>
          </div>
          <Card>
            <CardContent className="space-y-3 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Cohort</p>
                <p className="text-sm">
                  {cohorts.find((c) => c.id === existing.cohort_id)?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-sm">{new Date(existing.scheduled_at).toLocaleString()}</p>
              </div>
              {existing.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{existing.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm">Session ended · {new Date(existing.updated_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </GuruLayout>
    );
  }

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'Title must be at least 3 characters';
    if (!cohortId) return 'Please select a cohort';
    if (!date || !time) return 'Date and time are required';
    if (description.length > 300) return 'Description must be 300 characters or less';
    const scheduled = new Date(`${date}T${time}`);
    if (isNew && scheduled.getTime() < Date.now()) return 'Date must be in the future';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const payload = { title: title.trim(), description: description.trim(), cohort_id: cohortId, scheduled_at };
    try {
      if (isNew) {
        await createSession.mutateAsync(payload);
        toast.success('Session scheduled');
        navigate('/guru/sessions');
      } else if (existing) {
        await updateSession.mutateAsync({ id: existing.id, data: payload });
        toast.success('Session updated');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const isPending = createSession.isPending || updateSession.isPending;

  return (
    <GuruLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          to="/guru/sessions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sessions
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? 'Schedule Session' : 'Edit Session'}
          </h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Session title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning ES futures review"
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cohort">Cohort</Label>
                <Select value={cohortId} onValueChange={setCohortId} disabled={cohortsLoading}>
                  <SelectTrigger id="cohort">
                    <SelectValue placeholder="Select a cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCohorts.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No active cohorts. Create one first.
                      </div>
                    ) : (
                      activeCohorts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="What you'll cover in this session..."
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
              </div>

              <p className="text-xs text-muted-foreground border border-border rounded-md p-3 bg-muted/30">
                Audio and video are handled externally via Discord or Zoom. Share your meeting link
                with students separately. TradingGYM handles chart state broadcasting.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isNew ? 'Schedule Session' : 'Save Changes'}
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/guru/sessions">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </GuruLayout>
  );
}
