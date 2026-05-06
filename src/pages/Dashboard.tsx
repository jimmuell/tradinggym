import HelpSheet from '@/components/HelpSheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DollarSign, TrendingUp, Target, TrendingDown, BarChart3,
  RotateCcw, LineChart, Info, GraduationCap, ChevronRight,
  CreditCard, ExternalLink, Sparkles, Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { getPlanDisplayName, getPlanName } from '@/lib/tierUtils';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart as ReLineChart, Line, ResponsiveContainer, YAxis, Tooltip as ReTooltip } from 'recharts';

import LearningProgressCard from '@/components/dashboard/LearningProgressCard';
import { FoundationLearningPath, FoundationTradesEmpty } from '@/components/dashboard/FoundationEmptyState';
import { GuruTrialBanner } from '@/components/dashboard/GuruTrialBanner';
import LaunchSessionCard from '@/components/dashboard/LaunchSessionCard';

const STAT_TOOLTIPS: Record<string, string> = {
  'Total Trades': 'Number of completed simulated trades.',
  'Win Rate': 'Trades closed at take profit as a percentage of all closed trades.',
  'Avg R:R': 'Average risk-to-reward ratio achieved.',
  'Max Drawdown': 'Largest single losing trade in dollars.',
  'Sessions': 'Number of days traded in the simulator.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { currentTier, planState } = useTier();
  const navigate = useNavigate();
  const portal = useCustomerPortal();

  const { data: enrollments } = useQuery({
    queryKey: ['student_enrollments_count', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('class_enrollments')
        .select('id, class_id')
        .eq('student_id', user.id)
        .eq('status', 'active');
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .not('closed_at', 'is', null)
        .order('closed_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const computed = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: '—', winRate: '—', avgRR: '—', maxDrawdown: '—',
        sessions: '—', recentTrades: [], equityCurve: [], hasNoTrades: true,
      };
    }
    const totalTrades = trades.length;
    const outcomes = trades.filter(t => t.result && ['win', 'loss', 'breakeven'].includes(t.result));
    const wins = outcomes.filter(t => t.result === 'win').length;
    const winRate = outcomes.length > 0 ? ((wins / outcomes.length) * 100).toFixed(1) + '%' : '—';
    const rrTrades = trades.filter(t => t.stop_loss != null && t.entry_price != null && t.pnl != null);
    const rrValues = rrTrades
      .map(t => { const risk = Math.abs(t.entry_price! - t.stop_loss!); return risk > 0 ? t.pnl! / risk : null; })
      .filter((v): v is number => v !== null);
    const avgRR = rrValues.length > 0 ? (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2) : '—';
    const losses = trades.filter(t => t.pnl != null && t.pnl < 0).map(t => t.pnl!);
    const maxDrawdown = losses.length > 0 ? '$' + Math.abs(Math.min(...losses)).toFixed(2) : '—';
    const uniqueDates = new Set(trades.filter(t => t.closed_at).map(t => t.closed_at!.slice(0, 10)));
    const sessions = String(uniqueDates.size);
    const recentTrades = [...trades]
      .sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())
      .slice(0, 10);
    let cumPnl = 0;
    const equityCurve = [{ value: 0 }];
    for (const t of trades) { cumPnl += t.pnl ?? 0; equityCurve.push({ value: cumPnl }); }
    return { totalTrades: String(totalTrades), winRate, avgRR, maxDrawdown, sessions, recentTrades, equityCurve, hasNoTrades: false };
  }, [trades]);

  const isFoundationEmpty = currentTier === 'foundation' && computed.hasNoTrades;

  const stats = [
    { label: 'Total Trades', value: computed.totalTrades, icon: BarChart3 },
    { label: 'Win Rate', value: computed.winRate, icon: TrendingUp },
    { label: 'Avg R:R', value: computed.avgRR, icon: Target },
    { label: 'Max Drawdown', value: computed.maxDrawdown, icon: TrendingDown },
    { label: 'Sessions', value: computed.sessions, icon: LineChart },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TooltipProvider>
      <>

        {/* Subscription Status */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {getPlanName(planState)}
              </p>
              <p className="text-xs text-muted-foreground">
                {planState === 'starter'
                  ? "You're on the free plan. Upgrade to unlock all strategy tiers, AI strategy extraction, and more."
                  : `You're on the ${getPlanName(planState)} plan. Manage your subscription anytime.`}
              </p>
            </div>
            {planState === 'starter' ? (
              <Link to="/pricing" className="shrink-0">
                <Button size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Upgrade
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => portal.mutate(`${window.location.origin}/dashboard`)}
                disabled={portal.isPending}
                className="shrink-0 gap-2"
              >
                {portal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Manage
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Live Trading Session */}
        <LaunchSessionCard />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <HelpSheet pageName="Dashboard" />
        </div>

        {/* Combined Learning Progress Card */}
        <LearningProgressCard currentTier={currentTier} planState={planState} />

        {/* Guru Trial Banner (Expert tier only) */}
        <GuruTrialBanner />

        {/* Practice Account */}
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <div>
              <p className="text-sm text-muted-foreground">Practice Account</p>
              <h3 className="text-3xl font-bold flex items-center gap-2">
                <DollarSign className="h-7 w-7 text-primary" />
                10,000.00
              </h3>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset Account
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Resets your practice account balance to the starting amount</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">{STAT_TOOLTIPS[stat.label]}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Classes quick link */}
        {enrollments && enrollments.length > 0 && (
          <Card
            className="cursor-pointer hover:border-amber-500/40 transition-colors"
            onClick={() => navigate('/classes')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">My Classes</p>
                <p className="text-xs text-muted-foreground">
                  {enrollments.length} active {enrollments.length === 1 ? 'class' : 'classes'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equity Curve OR Foundation Learning Path */}
          {isFoundationEmpty ? (
            <FoundationLearningPath />
          ) : (
            <Card>
              <div className="p-6 pb-0"><h3 className="text-base font-semibold">Equity Curve</h3></div>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : computed.equityCurve.length > 1 ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <ReLineChart data={computed.equityCurve}>
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <ReTooltip
                        formatter={(value: number) => ['$' + value.toFixed(2), 'P&L']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </ReLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                    <LineChart className="h-10 w-10 mb-3 opacity-30" />
                    <p>Complete your first trading session</p>
                    <p className="text-xs">to see your equity curve</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Trades OR Foundation Empty */}
          {isFoundationEmpty ? (
            <FoundationTradesEmpty />
          ) : (
            <Card>
              <div className="p-6 pb-0"><h3 className="text-base font-semibold">Recent Trades</h3></div>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : computed.recentTrades.length > 0 ? (
                      computed.recentTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{formatDate(trade.closed_at!)}</TableCell>
                          <TableCell>{trade.symbol ?? '—'}</TableCell>
                          <TableCell>{trade.direction === 'long' ? 'Long' : 'Short'}</TableCell>
                          <TableCell className={`text-right font-medium ${(trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${(trade.pnl ?? 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                          No trades yet. Head to the Simulator to start practicing.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    </TooltipProvider>
  );
}
