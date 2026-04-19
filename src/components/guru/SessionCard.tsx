import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useGuruSessions } from '@/hooks/useGuruSessions';
import type { LiveSession, Class } from '@/types/guru';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface Props {
  session: LiveSession;
  className: string;
}

export default function SessionCard({ session, className }: Props) {
  const navigate = useNavigate();
  const { startSession, endSession, deleteSession } = useGuruSessions();
  const [confirm, setConfirm] = useState<'start' | 'end' | 'delete' | null>(null);

  const handleStart = async () => {
    try {
      await startSession.mutateAsync(session.id);
      toast.success('Session started');
      navigate(`/guru/sessions/${session.id}/live`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleEnd = async () => {
    try {
      await endSession.mutateAsync(session.id);
      toast.success('Session ended');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync(session.id);
      toast.success('Session deleted');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {session.status === 'scheduled' && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                Scheduled
              </Badge>
            )}
            {session.status === 'live' && (
              <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                Live
              </Badge>
            )}
            {session.status === 'ended' && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                Ended
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{className}</span>
          </div>
          <h3 className="font-semibold truncate">{session.title}</h3>
          <p className="text-xs text-muted-foreground">{formatDate(session.scheduled_at)}</p>
          {session.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">{session.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {session.status === 'scheduled' && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/guru/sessions/${session.id}`}>Edit</Link>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-500"
                onClick={() => setConfirm('start')}
              >
                Start Session
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirm('delete')}
                aria-label="Delete session"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          {session.status === 'live' && (
            <>
              <Button asChild size="sm" className="bg-green-600 text-white hover:bg-green-500">
                <Link to={`/guru/sessions/${session.id}/live`}>
                  <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Enter Session
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setConfirm('end')}
              >
                End Session
              </Button>
            </>
          )}
          {session.status === 'ended' && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/guru/sessions/${session.id}`}>View Summary</Link>
            </Button>
          )}
        </div>
      </CardContent>

      <AlertDialog open={confirm === 'start'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Students in {className} will be able to join immediately. Make sure you're ready.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 text-white hover:bg-green-500"
              onClick={handleStart}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === 'end'} onOpenChange={(o) => !o && setConfirm(null)}>
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

      <AlertDialog open={confirm === 'delete'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Students will be notified it was cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteSession.isPending}
            >
              {deleteSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export type { Class };
