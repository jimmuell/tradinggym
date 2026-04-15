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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const metrics = [
  { label: 'Total P&L', value: '$0.00', icon: DollarSign, change: null },
  { label: 'Win Rate', value: '0%', icon: Target, change: null },
  { label: 'Profit Factor', value: '0.0', icon: TrendingUp, change: null },
  { label: 'Avg Winner', value: '$0.00', icon: TrendingUp, change: null },
  { label: 'Avg Loser', value: '$0.00', icon: TrendingDown, change: null },
  { label: 'Best Trade', value: '$0.00', icon: Activity, change: null },
  { label: 'Worst Trade', value: '$0.00', icon: Activity, change: null },
  { label: 'Total Trades', value: '0', icon: BarChart3, change: null },
];

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

function JournalEntry({ date, note, tags }: { date: string; note: string; tags: string[] }) {
  return (
    <div className="flex gap-4 py-3">
      <div className="shrink-0 text-xs text-muted-foreground w-20 pt-0.5">{date}</div>
      <div className="flex-1 space-y-1.5">
        <p className="text-sm text-foreground">{note}</p>
        <div className="flex gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
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
        <Select defaultValue="all-time">
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

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-bold text-foreground">{m.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EmptyChart
              title="Equity Curve"
              icon={LineChart}
              description="Complete trades to see your equity over time"
            />
            <EmptyChart
              title="Daily P&L"
              icon={BarChart3}
              description="Your daily profit and loss will appear here"
            />
          </div>

          {/* Streaks & Consistency */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EmptyChart
              title="Win/Loss Distribution"
              icon={PieChart}
              description="Trade outcome breakdown will appear here"
            />
            <EmptyChart
              title="P&L by Time of Day"
              icon={Clock}
              description="See which hours are most profitable"
            />
            <EmptyChart
              title="P&L by Strategy"
              icon={Target}
              description="Compare performance across strategies"
            />
            <EmptyChart
              title="Trade Duration"
              icon={Activity}
              description="How long your trades last on average"
            />
          </div>
        </TabsContent>

        {/* Journal Tab */}
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
