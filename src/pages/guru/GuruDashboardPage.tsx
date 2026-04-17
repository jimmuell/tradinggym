import { Link } from 'react-router-dom';
import { Loader2, Users, Layers, DollarSign, TrendingUp, GraduationCap } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGuruProfile, useGuruApplication } from '@/hooks/useGuruData';

const STATS = [
  { label: 'Active Students', icon: Users },
  { label: 'Active Cohorts', icon: Layers },
  { label: "This Month's Revenue", icon: DollarSign },
  { label: 'Avg Student Win Rate', icon: TrendingUp },
];

export default function GuruDashboardPage() {
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { data: guruApplication, isLoading: loadingApp } = useGuruApplication();

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
          {STATS.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
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
