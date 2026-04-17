import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Monitor, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruSessions } from '@/hooks/useGuruSessions';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function GuruSessionLivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { sessions, isLoading: sessionsLoading, endSession } = useGuruSessions();
  const { cohorts } = useGuruCohorts();
  const [now, setNow] = useState(Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);

  const session = useMemo(() => sessions.find((s) => s.id === id) ?? null, [sessions, id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (profileLoading || sessionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (guruProfile?.status !== 'active') return <Navigate to="/guru" replace />;
  if (!session) return <Navigate to="/guru/sessions" replace />;
  if (session.guru_id !== guruProfile.id) return <Navigate to="/guru/sessions" replace />;
  if (session.status !== 'live') return <Navigate to="/guru/sessions" replace />;

  const cohortName = cohorts.find((c) => c.id === session.cohort_id)?.name ?? '—';
  const duration = formatDuration(now - new Date(session.scheduled_at).getTime());

  const handleEnd = async () => {
    try {
      await endSession.mutateAsync(session.id);
      toast.success('Session ended');
      navigate('/guru/sessions');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold truncate">{session.title}</h1>
          <p className="text-xs text-muted-foreground">{cohortName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            LIVE
          </Badge>
          <span className="font-mono text-sm text-muted-foreground">{duration}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">— students</span>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmEnd(true)}
          >
            End Session
          </Button>
        </div>
      </header>

      {/* Main + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
            <div className="text-center">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-base font-medium">Chart broadcaster will appear here in P26</p>
              <p className="text-sm text-muted-foreground mt-1">
                PartyKit WebSocket integration — coming next prompt
              </p>
            </div>
          </div>
        </main>

        <aside className="hidden w-60 shrink-0 border-l border-border bg-card p-4 lg:block">
          <h2 className="text-sm font-semibold mb-3">Students</h2>
          <p className="text-xs text-muted-foreground">
            Students will appear here when they join.
          </p>
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div className="border-t border-border bg-card p-3 lg:hidden">
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmEnd(true)}
        >
          End Session
        </Button>
      </div>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session will be closed for all students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEnd}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'End Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
