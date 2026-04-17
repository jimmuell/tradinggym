import { useState } from 'react';
import HelpSheet from '@/components/HelpSheet';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Activity,
  Calendar,
  Clock,
  PieChart,
  LineChart,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAnalytics, AnalyticsFilter } from '@/hooks/useAnalytics';
import { EquityCurveChart } from '@/components/analytics/EquityCurveChart';
import { DailyPnlChart } from '@/components/analytics/DailyPnlChart';
import { WinLossStats } from '@/components/analytics/WinLossStats';

const fmtCurrency = (v: number) =>
  `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;

function EmptyChart({ title, icon: Icon, description }: { title: string; icon: React.ElementType; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed rounded-md">
          <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [filter, setFilter] = useState<AnalyticsFilter>('all-time');
  const a = useAnalytics(filter);

  const metrics = [
    { label: 'Total P&L', value: fmtCurrency(a.totalPnl), icon: DollarSign, negative: a.totalPnl < 0 },
    { label: 'Win Rate', value: `${a.winRate.toFixed(0)}%`, icon: Target, negative: false },
    { label: 'Profit Factor', value: a.profitFactor.toFixed(2), icon: TrendingUp, negative: false },
    { label: 'Avg Winner', value: fmtCurrency(a.avgWinner), icon: TrendingUp, negative: false },
    { label: 'Avg Loser', value: fmtCurrency(a.avgLoser), icon: TrendingDown, negative: a.avgLoser < 0 },
    { label: 'Best Trade', value: fmtCurrency(a.bestTrade), icon: Activity, negative: a.bestTrade < 0 },
    { label: 'Worst Trade', value: fmtCurrency(a.worstTrade), icon: Activity, negative: a.worstTrade < 0 },
    { label: 'Total Trades', value: String(a.totalTrades), icon: BarChart3, negative: false },
  ];

  const showSkeletons = a.isLoading && a.totalTrades === 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your performance, identify patterns, and improve your trading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpSheet pageName="Analytics" />
          <Select value={filter} onValueChange={(v) => setFilter(v as AnalyticsFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {showSkeletons
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </CardContent>
                  </Card>
                ))
              : metrics.map((m) => (
                  <Card key={m.label}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                        <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className={cn('text-lg font-bold', m.negative ? 'text-red-500' : 'text-foreground')}>
                        {m.value}
                      </span>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {a.equityCurve.length === 0 ? (
              <EmptyChart title="Equity Curve" icon={LineChart} description="Complete trades to see your equity over time" />
            ) : (
              <ChartCard title="Equity Curve" icon={LineChart}>
                <EquityCurveChart data={a.equityCurve} totalPnl={a.totalPnl} />
              </ChartCard>
            )}
            {a.dailyPnl.length === 0 ? (
              <EmptyChart title="Daily P&L" icon={BarChart3} description="Your daily profit and loss will appear here" />
            ) : (
              <ChartCard title="Daily P&L" icon={BarChart3}>
                <DailyPnlChart data={a.dailyPnl} />
              </ChartCard>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Current Streak</span>
                </div>
                <span className="text-2xl font-bold text-foreground">0</span>
                <span className="text-xs text-muted-foreground ml-1">days</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sessions This Week</span>
                </div>
                <span className="text-2xl font-bold text-foreground">0</span>
                <span className="text-xs text-muted-foreground ml-1">/ 5</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Session Length</span>
                </div>
                <span className="text-2xl font-bold text-foreground">0</span>
                <span className="text-xs text-muted-foreground ml-1">min</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Blueprint Accuracy</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{a.avgStepAccuracy.toFixed(0)}%</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Win/Loss Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WinLossStats wins={a.wins} losses={a.losses} breakevens={a.breakevens} />
              </CardContent>
            </Card>
            <EmptyChart title="P&L by Time of Day" icon={Clock} description="See which hours are most profitable" />
            <EmptyChart title="P&L by Strategy" icon={Target} description="Compare performance across strategies" />
            <EmptyChart title="Trade Duration" icon={Activity} description="How long your trades last on average" />
          </div>
        </TabsContent>

        <TabsContent value="journal" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Trading Journal
              </CardTitle>
              <CardDescription>
                Record observations, emotions, and lessons from each session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Journal Entries Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  After completing a trading session, you'll be able to add notes about what went well,
                  what you'd improve, and key takeaways.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
