import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  Target,
  TrendingDown,
  BarChart3,
  RotateCcw,
  LineChart,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LineChart as ReLineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const tiers = [
  { name: 'Foundation', active: true },
  { name: 'Tier 1', active: false },
  { name: 'Tier 2', active: false },
  { name: 'Tier 3', active: false },
];

export default function Dashboard() {
  const { user } = useAuth();

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
        totalTrades: '—',
        winRate: '—',
        avgRR: '—',
        maxDrawdown: '—',
        sessions: '—',
        recentTrades: [],
        equityCurve: [],
      };
    }

    const totalTrades = trades.length;

    const outcomes = trades.filter(t => t.result && ['win', 'loss', 'breakeven'].includes(t.result));
    const wins = outcomes.filter(t => t.result === 'win').length;
    const winRate = outcomes.length > 0 ? ((wins / outcomes.length) * 100).toFixed(1) + '%' : '—';

    const rrTrades = trades.filter(t => t.stop_loss != null && t.entry_price != null && t.pnl != null);
    const rrValues = rrTrades
      .map(t => {
        const risk = Math.abs(t.entry_price! - t.stop_loss!);
        return risk > 0 ? t.pnl! / risk : null;
      })
      .filter((v): v is number => v !== null);
    const avgRR = rrValues.length > 0
      ? (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2)
      : '—';

    const losses = trades.filter(t => t.pnl != null && t.pnl < 0).map(t => t.pnl!);
    const maxDrawdown = losses.length > 0 ? '$' + Math.abs(Math.min(...losses)).toFixed(2) : '—';

    const uniqueDates = new Set(
      trades.filter(t => t.closed_at).map(t => t.closed_at!.slice(0, 10))
    );
    const sessions = String(uniqueDates.size);

    const recentTrades = [...trades]
      .sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())
      .slice(0, 10);

    let cumPnl = 0;
    const equityCurve = [{ value: 0 }];
    for (const t of trades) {
      cumPnl += t.pnl ?? 0;
      equityCurve.push({ value: cumPnl });
    }

    return {
      totalTrades: String(totalTrades),
      winRate,
      avgRR,
      maxDrawdown,
      sessions,
      recentTrades,
      equityCurve,
    };
  }, [trades]);

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Practice Account */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardDescription className="text-sm">Practice Account</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-primary" />
              10,000.00
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Account
          </Button>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <stat.icon className="h-3.5 w-3.5" />
                {stat.label}
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

      {/* Tier Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tier Progress</CardTitle>
          <CardDescription className="text-xs">Complete each tier to unlock the next level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {tiers.map((tier, i) => (
              <div key={tier.name} className="flex items-center gap-2">
                <Badge
                  variant={tier.active ? 'default' : 'outline'}
                  className={tier.active ? '' : 'text-muted-foreground'}
                >
                  {tier.name}
                </Badge>
                {i < tiers.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          <Progress value={0} className="mt-4 h-2" />
          <p className="text-xs text-muted-foreground mt-2">0% complete — Start your Foundation modules to begin</p>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : computed.equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={192}>
                <ReLineChart data={computed.equityCurve}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip
                    formatter={(value: number) => ['$' + value.toFixed(2), 'P&L']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
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

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Trades</CardTitle>
          </CardHeader>
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
      </div>
    </div>
  );
}
