import { Link } from 'react-router-dom';
import { Loader2, Users, Layers, DollarSign, TrendingUp, GraduationCap, Video } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile, useGuruApplication } from '@/hooks/useGuruData';
import { useGuruDashboardStats } from '@/hooks/useGuruDashboardStats';
import { useGuruSessions } from '@/hooks/useGuruSessions';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';

export default function GuruDashboardPage() {
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { data: guruApplication, isLoading: loadingApp } = useGuruApplication();
  const { activeStudents, activeCohorts, isLoading: loadingStats } = useGuruDashboardStats(guruProfile?.id);
  const { upcomingSessions, isLoading: loadingSessions } = useGuruSessions();
  const { cohorts } = useGuruCohorts();

  if (loadingProfile || loadingApp) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  const isActive = guruProfile?.status === 'active';

  if (!isActive) {
    const hasPending = guruApplication?.status === 'pending';
    return (
      <GuruLayout>
        <div className="mx-auto max-w-2xl">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                <GraduationCap className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold">
                {hasPending ? 'Application Pending' : 'Apply to Become a Guru'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasPending
                  ? "We're reviewing your application. You'll get an email once it's been processed."
                  : 'Run your trading coaching business inside TradingGYM. Apply now to get started.'}
              </p>
              <Button asChild className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                <Link to="/guru/apply">
                  {hasPending ? 'View Application' : 'Apply Now'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </GuruLayout>
    );
  }

  const stats: { label: string; icon: typeof Users; value: React.ReactNode }[] = [
    {
      label: 'Active Students',
      icon: Users,
      value: loadingStats ? <Skeleton className="h-7 w-10" /> : activeStudents,
    },
    {
      label: 'Active Cohorts',
      icon: Layers,
      value: loadingStats ? <Skeleton className="h-7 w-10" /> : activeCohorts,
    },
    { label: "This Month's Revenue", icon: DollarSign, value: '—' },
    { label: 'Avg Student Win Rate', icon: TrendingUp, value: '—' },
  ];

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guru Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {guruProfile?.display_name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Your cohorts, students, and content will appear here as you publish them.
          </CardContent>
        </Card>
      </div>
    </GuruLayout>
  );
}
