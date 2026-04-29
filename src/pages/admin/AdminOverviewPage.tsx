import { Navigate, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Ticket,
  DollarSign,
  Target,
  TrendingUp,
  GitBranch,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminStats, type AdminStats } from '@/hooks/useAdminStats';

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString();

const PLAN_COLORS: Record<string, string> = {
  Starter: 'hsl(var(--muted-foreground))',
  Pro: 'hsl(217 91% 60%)',
  Expert: 'hsl(270 91% 65%)',
  Guru: 'hsl(38 92% 50%)',
  Admin: 'hsl(0 84% 60%)',
};

const TIER_COLORS: Record<string, string> = {
  Foundation: 'hsl(var(--muted-foreground))',
  'Tier 1': 'hsl(217 91% 60%)',
  'Tier 2': 'hsl(160 84% 39%)',
  'Tier 3': 'hsl(270 91% 65%)',
  Coach: 'hsl(38 92% 50%)',
};

function MetricCard({
  label,
  value,
  sub,
  Icon,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { data, isLoading } = useAdminStats(isAdmin);

  if (roleLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const s = data as AdminStats | undefined;

  const planData = [
    { name: 'Starter', value: s?.plan_starter ?? 0 },
    { name: 'Pro', value: s?.plan_pro ?? 0 },
    { name: 'Expert', value: s?.plan_expert ?? 0 },
    { name: 'Guru', value: s?.plan_guru ?? 0 },
    { name: 'Admin', value: s?.plan_admin ?? 0 },
  ].filter((d) => d.value > 0);

  const tierData = [
    { name: 'Foundation', value: s?.tier_foundation ?? 0 },
    { name: 'Tier 1', value: s?.tier_1 ?? 0 },
    { name: 'Tier 2', value: s?.tier_2 ?? 0 },
    { name: 'Tier 3', value: s?.tier_3 ?? 0 },
    { name: 'Coach', value: s?.tier_coach ?? 0 },
  ];

  const signupTrend = (s?.signup_trend ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    signups: Number(d.signups),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Platform operations summary</p>
      </div>

      {/* Row 1 — Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={fmt(s?.total_users)}
          sub={`+${fmt(s?.users_this_week)} this week`}
          Icon={Users}
          loading={isLoading}
        />
        <MetricCard
          label="MRR"
          value={`$${fmt(s?.mrr)}`}
          sub="Estimated monthly recurring revenue"
          Icon={DollarSign}
          loading={isLoading}
        />
        <MetricCard
          label="Active Strategies"
          value={fmt(s?.total_strategies)}
          sub={`+${fmt(s?.strategies_this_week)} this week`}
          Icon={Target}
          loading={isLoading}
        />
        <MetricCard
          label="Total Trades"
          value={fmt(s?.total_trades)}
          sub={`+${fmt(s?.trades_this_week)} this week`}
          Icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : signupTrend.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No signups in the last 30 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={signupTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#signupFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : planData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No plan data
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={planData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="hsl(var(--background))"
                    >
                      {planData.map((entry) => (
                        <Cell key={entry.name} fill={PLAN_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-0 h-[200px]">
                  <div className="text-2xl font-bold">{fmt(s?.total_users)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Users</div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {planData.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ background: PLAN_COLORS[p.name] }}
                      />
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="ml-auto font-medium">{fmt(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Active Gurus"
          value={fmt(s?.active_gurus)}
          sub={`${fmt(s?.pending_applications)} pending applications`}
          Icon={GraduationCap}
          loading={isLoading}
        />
        <MetricCard
          label="Classes"
          value={fmt(s?.total_classes)}
          sub={`${fmt(s?.total_enrollments)} active enrollments`}
          Icon={GitBranch}
          loading={isLoading}
        />
        <MetricCard
          label="Invite Codes"
          value={`${fmt(s?.active_invites)} active`}
          sub={`${fmt(s?.used_invites)} used`}
          Icon={Ticket}
          loading={isLoading}
        />
      </div>

      {/* Row 4 — Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tierData.map((t) => (
                <Badge
                  key={t.name}
                  variant="outline"
                  className="gap-2 px-3 py-1.5 text-xs"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: TIER_COLORS[t.name] }}
                  />
                  <span className="text-muted-foreground">{t.name}</span>
                  <span className="font-semibold text-foreground">{fmt(t.value)}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 5 — Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <Users className="h-4 w-4 mr-2" /> Manage Users
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/gurus')}>
            <GraduationCap className="h-4 w-4 mr-2" /> Review Guru Applications
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/invites')}>
            <Ticket className="h-4 w-4 mr-2" /> Manage Invite Codes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
