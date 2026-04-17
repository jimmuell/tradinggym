import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, Video, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruSessions } from '@/hooks/useGuruSessions';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import SessionCard from '@/components/guru/SessionCard';

export default function GuruSessionsPage() {
  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { upcomingSessions, pastSessions, isLoading } = useGuruSessions();
  const { cohorts } = useGuruCohorts();
  const [showPast, setShowPast] = useState(false);

  const cohortName = useMemo(() => {
    const map = new Map<string, string>();
    cohorts.forEach((c) => map.set(c.id, c.name));
    return (id: string) => map.get(id) ?? 'Unknown cohort';
  }, [cohorts]);

  if (profileLoading) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  if (guruProfile?.status !== 'active') return <Navigate to="/guru" replace />;

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Schedule and manage live trading sessions for your cohorts
            </p>
          </div>
          <Button asChild>
            <Link to="/guru/sessions/new">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming Sessions
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No upcoming sessions. Schedule one to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => (
                <SessionCard key={s.id} session={s} cohortName={cohortName(s.cohort_id)} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            {showPast ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Past Sessions ({pastSessions.length})
          </button>
          {showPast && (
            <>
              {pastSessions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No past sessions yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((s) => (
                    <SessionCard key={s.id} session={s} cohortName={cohortName(s.cohort_id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </GuruLayout>
  );
}
