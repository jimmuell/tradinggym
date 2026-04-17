import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, TrendingUp, Activity, DollarSign, Hash } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { cn } from '@/lib/utils';
import { getTierDisplayName } from '@/lib/tierUtils';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function GuruStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { profile, enrollment, trades, stats, streak, isLoading, notFound } =
    useStudentProgress(studentId);

  if (loadingProfile) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  if (guruProfile?.status !== 'active') return <Navigate to="/guru" replace />;
  if (notFound) return <Navigate to="/guru/students" replace />;

  const initial = profile?.display_name?.charAt(0).toUpperCase() ?? '?';
  const gate = enrollment?.cohort.win_rate_gate ?? 0;
  const meetsGate = stats?.meets_win_rate_gate ?? false;

  return (
    <GuruLayout>
      <div className="space-y-6">
        <Link
          to="/guru/students"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Students
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* Left column */}
            <div className="space-y-4">
              {/* Overview */}
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-amber-500/15 text-amber-400 text-xl">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold">{profile?.display_name}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {profile?.tier_state ? getTierDisplayName(profile.tier_state) : ''}
                      </Badge>
                    </div>
                  </div>

                  {enrollment && (
                    <div className="space-y-1 border-t border-border pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cohort</span>
                        <span className="font-medium">{enrollment.cohort.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Enrolled</span>
                        <span>{fmtDate(enrollment.enrolled_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline" className="text-xs">
                          {enrollment.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {stats && (
                    <div
                      className={cn(
                        'rounded-md border p-3 text-sm',
                        meetsGate
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                      )}
                    >
                      {meetsGate
                        ? '✅ Win rate gate met — student is on track'
                        : `⚠️ Win rate below gate — ${gate}% required, currently ${stats.win_rate.toFixed(1)}%`}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Trades" icon={Hash} value={stats?.total_trades ?? 0} />
                <StatCard
                  label="Win Rate"
                  icon={TrendingUp}
                  value={`${(stats?.win_rate ?? 0).toFixed(1)}%`}
                />
                <StatCard
                  label="Net P&L"
                  icon={DollarSign}
                  value={`$${(stats?.net_pnl ?? 0).toFixed(2)}`}
                  valueClass={
                    (stats?.net_pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                />
                <StatCard
                  label="Current Streak"
                  icon={Activity}
                  value={streak}
                  valueClass={streak > 0 ? 'text-green-500' : streak < 0 ? 'text-red-500' : ''}
                />
              </div>
            </div>

            {/* Right column — trades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {trades.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    This student hasn't completed any trading sessions yet.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Direction</th>
                        <th className="px-4 py-3 text-left font-medium">Result</th>
                        <th className="px-4 py-3 text-right font-medium">P&L</th>
                        <th className="px-4 py-3 text-right font-medium">Steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.slice(0, 20).map((t) => {
                        const pnl = Number(t.pnl ?? 0);
                        const stepsCount = t.steps_completed?.length ?? 0;
                        return (
                          <tr key={t.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 text-muted-foreground">
                              {fmtDate(t.opened_at)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs capitalize">
                                {t.direction ?? '—'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'text-xs font-medium capitalize',
                                  t.result === 'win'
                                    ? 'text-green-500'
                                    : t.result === 'loss'
                                    ? 'text-red-500'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {t.result ?? 'breakeven'}
                              </span>
                            </td>
                            <td
                              className={cn(
                                'px-4 py-3 text-right tabular-nums',
                                pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : '',
                              )}
                            >
                              ${pnl.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                              {stepsCount}/6
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}

function StatCard({
  label,
  icon: Icon,
  value,
  valueClass,
}: {
  label: string;
  icon: typeof TrendingUp;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', valueClass)}>{value}</div>
      </CardContent>
    </Card>
  );
}
