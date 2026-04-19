import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Users, GraduationCap } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useCohortStudents } from '@/hooks/useCohortStudents';
import type { EnrolledStudent } from '@/types/guru';
import { cn } from '@/lib/utils';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function winRateColor(winRate: number, gate: number): string {
  if (winRate >= gate) return 'text-green-500';
  if (winRate >= gate - 10) return 'text-amber-500';
  return 'text-red-500';
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'bg-green-500/15 text-green-400 border border-green-500/30';
  if (status === 'paused') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  return 'bg-muted text-muted-foreground border border-border';
}

export default function GuruStudentsPage() {
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { students, cohorts, isLoading } = useCohortStudents();
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  const filtered = useMemo<EnrolledStudent[]>(() => {
    if (selectedCohort === 'all') return students;
    return students.filter((s) => s.enrollment.cohort_id === selectedCohort);
  }, [students, selectedCohort]);

  if (loadingProfile) {
    return (
      <GuruLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </GuruLayout>
    );
  }

  if (guruProfile?.status !== 'active') {
    return <Navigate to="/guru" replace />;
  }

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            All enrolled students across your cohorts
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : cohorts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-semibold">No cohorts yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create a cohort first before managing students.
              </p>
              <Button asChild className="bg-amber-500 text-amber-950 hover:bg-amber-400">
                <Link to="/guru/classes">Go to Classes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs value={selectedCohort} onValueChange={setSelectedCohort}>
              <TabsList>
                <TabsTrigger value="all">All ({students.length})</TabsTrigger>
                {cohorts.map((c) => {
                  const count = students.filter((s) => s.enrollment.cohort_id === c.id).length;
                  return (
                    <TabsTrigger key={c.id} value={c.id}>
                      {c.name} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-1 text-lg font-semibold">No students yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Students will appear here once they enroll in your cohort.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Student</th>
                          <th className="px-4 py-3 text-left font-medium">Cohort</th>
                          <th className="px-4 py-3 text-left font-medium">Enrolled</th>
                          <th className="px-4 py-3 text-right font-medium">Trades</th>
                          <th className="px-4 py-3 text-right font-medium">Win Rate</th>
                          <th className="px-4 py-3 text-center font-medium">Gate</th>
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => {
                          const initial = s.profile.display_name.charAt(0).toUpperCase();
                          return (
                            <tr key={s.enrollment.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-amber-500/15 text-amber-400 text-xs">
                                      {initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">
                                    {s.profile.display_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="font-normal">
                                  {s.cohort.name}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {timeAgo(s.enrollment.enrolled_at)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {s.stats.total_trades}
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right tabular-nums font-medium',
                                  winRateColor(s.stats.win_rate, s.cohort.win_rate_gate),
                                )}
                              >
                                {s.stats.win_rate.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                {s.stats.meets_win_rate_gate ? (
                                  <span className="text-green-500 text-xs">✅ Met</span>
                                ) : (
                                  <span className="text-amber-500 text-xs">⚠️ Not yet</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn('rounded px-2 py-0.5 text-xs', statusBadgeClass(s.enrollment.status))}>
                                  {s.enrollment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate(`/guru/students/${s.profile.user_id}`)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card stack */}
                  <div className="space-y-3 p-3 md:hidden">
                    {filtered.map((s) => {
                      const initial = s.profile.display_name.charAt(0).toUpperCase();
                      return (
                        <button
                          key={s.enrollment.id}
                          onClick={() => navigate(`/guru/students/${s.profile.user_id}`)}
                          className="w-full rounded-md border border-border bg-card p-3 text-left hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-amber-500/15 text-amber-400 text-xs">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{s.profile.display_name}</div>
                              <div className="text-xs text-muted-foreground">{s.cohort.name}</div>
                            </div>
                            <span className={cn('text-sm font-medium', winRateColor(s.stats.win_rate, s.cohort.win_rate_gate))}>
                              {s.stats.win_rate.toFixed(0)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </GuruLayout>
  );
}
