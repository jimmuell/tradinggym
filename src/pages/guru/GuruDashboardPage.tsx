import { Link } from 'react-router-dom';
import { Loader2, Users, Layers, DollarSign, TrendingUp, GraduationCap, Video, Radio } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile, useGuruApplication } from '@/hooks/useGuruData';
import { useGuruDashboardStats } from '@/hooks/useGuruDashboardStats';
import { useGuruSessions } from '@/hooks/useGuruSessions';
import { useGuruClasses } from '@/hooks/useGuruClasses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function GuruDashboardPage() {
  const { user } = useAuth();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { data: guruApplication, isLoading: loadingApp } = useGuruApplication();
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });
  const { activeStudents, activeClasses, isLoading: loadingStats } = useGuruDashboardStats(guruProfile?.id);
  const { sessions, upcomingSessions, isLoading: loadingSessions } = useGuruSessions();
  const { classes } = useGuruClasses();
  const liveSession = sessions.find((s) => s.status === 'live') ?? null;

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
      label: 'Active Classes',
      icon: Layers,
      value: loadingStats ? <Skeleton className="h-7 w-10" /> : activeClasses,
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
            Welcome, {userProfile?.display_name ?? 'Guru'}
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

        {liveSession ? (
          <Card className="border-l-4 border-l-green-500 border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-400">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    Session Live
                  </p>
                  <p className="font-medium truncate mt-1">
                    {liveSession.title} — {classes.find((c) => c.id === liveSession.class_id)?.name ?? '—'}
                  </p>
                </div>
                <Button asChild className="bg-green-600 text-white hover:bg-green-500">
                  <Link to={`/guru/sessions/${liveSession.id}/live`}>Enter Session →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  Next Session
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/guru/sessions">View all</Link>
                </Button>
              </div>
              {loadingSessions ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingSessions.length === 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">No sessions scheduled</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/guru/sessions/new">Schedule One</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{upcomingSessions[0].title}</p>
                    <p className="text-xs text-muted-foreground">
                      {classes.find((c) => c.id === upcomingSessions[0].class_id)?.name ?? '—'} ·{' '}
                      {new Date(upcomingSessions[0].scheduled_at).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/guru/sessions/${upcomingSessions[0].id}`}>
                      {upcomingSessions[0].status === 'live' ? 'Enter Session' : 'Manage'}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </GuruLayout>
  );
}
