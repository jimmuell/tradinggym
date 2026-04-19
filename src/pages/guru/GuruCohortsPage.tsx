import { Link, Navigate } from 'react-router-dom';
import { GraduationCap, Plus, Loader2 } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import CohortCard from '@/components/guru/CohortCard';

export default function GuruCohortsPage() {
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { cohorts, isLoading } = useGuruCohorts();

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

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your classes
            </p>
          </div>
          <Button asChild className="bg-amber-500 text-amber-950 hover:bg-amber-400">
            <Link to="/guru/classes/new">
              <Plus className="h-4 w-4" />
              New Class
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : cohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No classes yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first class to start enrolling students.
            </p>
            <Button asChild className="mt-6 bg-amber-500 text-amber-950 hover:bg-amber-400">
              <Link to="/guru/cohorts/new">
                <Plus className="h-4 w-4" />
                Create Class
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cohorts.map((c) => (
              <CohortCard key={c.id} cohort={c} />
            ))}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
