import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestorKpis } from '@/hooks/useInvestorKpis';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Headline({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/40">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardContent className="pt-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-3xl md:text-4xl font-bold mt-2">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
          </div>
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestorKpisPage() {
  const { data, isLoading } = useInvestorKpis();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const planRows = [
    { label: 'Pro ($29)', users: data.plan_pro, revenue: data.plan_pro * 29 },
    { label: 'Expert ($49)', users: data.plan_expert, revenue: data.plan_expert * 49 },
    { label: 'Guru ($99)', users: data.plan_guru, revenue: data.plan_guru * 99 },
    { label: 'Starter (Free)', users: data.plan_starter, revenue: 0 },
  ];

  const engagement = [
    { label: 'Strategies Created', value: data.total_strategies },
    { label: 'Trades Executed', value: data.total_trades },
    { label: 'Active Gurus', value: data.active_gurus },
    { label: 'Classes', value: data.total_classes },
    { label: 'Student Enrollments', value: data.total_enrollments },
    { label: 'Lessons Published', value: data.total_lessons },
    { label: 'Quiz Attempts', value: data.total_quiz_attempts },
    { label: 'Playback Scenarios', value: data.playback_scenarios },
  ];

  const highlights = [
    'AI Strategy Ingestion — paste any trading idea, AI extracts a structured strategy',
    'Strategy Playback Trainer — step-by-step visual walkthrough on real MES data',
    'Pine Script Export — one-click export to TradingView indicators',
    'Guru Platform — full coaching SaaS with Stripe Connect payouts',
    '73-test Playwright suite passing — production-quality codebase',
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Platform KPIs</h1>
        <p className="text-sm text-muted-foreground">Live metrics — refreshed every minute</p>
      </div>

      {/* Row 1 — Headlines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Headline label="MRR" value={money(data.mrr)} sub="Monthly Recurring Revenue" Icon={DollarSign} />
        <Headline label="ARR" value={money(data.arr)} sub="Annual Run Rate" Icon={TrendingUp} />
        <Headline
          label="Total Users"
          value={fmt(data.total_users)}
          sub={`+${fmt(data.users_this_month)} this month`}
          Icon={Users}
        />
        <Headline
          label="Conversion Rate"
          value={`${data.conversion_rate}%`}
          sub="Free → Paid"
          Icon={Percent}
        />
      </div>

      {/* Row 2 — Growth chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <p className="text-xs text-muted-foreground">Weekly signups — last 12 weeks</p>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly_growth ?? []}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#growthFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 3 — Plan + Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {planRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                  <div className="text-sm">{row.label}</div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className="text-xs text-muted-foreground">Users</div>
                      <div className="font-semibold">{fmt(row.users)}</div>
                    </div>
                    <div className="min-w-[80px]">
                      <div className="text-xs text-muted-foreground">Revenue/mo</div>
                      <div className="font-semibold text-primary">{money(row.revenue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {engagement.map((m) => (
                <div key={m.label} className="rounded-md border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-xl font-bold mt-1">{fmt(m.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Key Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
