import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentCohort } from '@/hooks/useStudentEnrollments';
import { useCohortSessions } from '@/hooks/useCohortSessions';

export default function CoachingSessionPage() {
  const { cohortId, sessionId } = useParams<{ cohortId: string; sessionId: string }>();
  const { user } = useAuth();
  const { enrolled, isLoading: enrLoading } = useStudentCohort(cohortId);
  const { sessions, isLoading: sessionsLoading } = useCohortSessions(cohortId);

  const session = sessions.find((s) => s.id === sessionId) ?? null;

  // Record attendance on mount, update left_at on unmount
  useEffect(() => {
    if (!user?.id || !sessionId || !session || session.status !== 'live') return;
    let cancelled = false;
    const studentId = user.id;
    const sid = sessionId;

    (async () => {
      const { error } = await supabase
        .from('live_session_attendance')
        .upsert(
          { session_id: sid, student_id: studentId, joined_at: new Date().toISOString(), left_at: null },
          { onConflict: 'session_id,student_id' },
        );
      if (error && !cancelled) {
        // Non-fatal; viewer can still watch
        console.error('attendance upsert failed', error);
      }
    })();

    return () => {
      cancelled = true;
      void supabase
        .from('live_session_attendance')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sid)
        .eq('student_id', studentId);
    };
  }, [user?.id, sessionId, session]);

  if (enrLoading || sessionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrolled) return <Navigate to="/coaching" replace />;
  if (!session) {
    toast.error('This session is not currently live');
    return <Navigate to={`/coaching/${cohortId}`} replace />;
  }
  if (session.status !== 'live') {
    toast.error('This session is not currently live');
    return <Navigate to={`/coaching/${cohortId}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold truncate">{session.title}</h1>
          <p className="text-xs text-muted-foreground">{enrolled.cohort.name}</p>
        </div>
        <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          LIVE
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link to={`/coaching/${cohortId}`}>Leave Session</Link>
        </Button>
      </header>

      <main className="flex-1 p-6">
        <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
          <div className="text-center">
            <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-base font-medium">Live chart viewer will appear here in P26</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your coach's chart will stream here in real time
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Audio/video: Join your coach's Discord or Zoom for audio
        </p>
      </footer>
    </div>
  );
}
