import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

const tiers = [
  { name: 'Foundation', active: true },
  { name: 'Tier 1', active: false },
  { name: 'Tier 2', active: false },
  { name: 'Tier 3', active: false },
];

const stats = [
  { label: 'Total Trades', value: '0', icon: BarChart3 },
  { label: 'Win Rate', value: '0%', icon: TrendingUp },
  { label: 'Avg R:R', value: '0.0', icon: Target },
  { label: 'Max Drawdown', value: '$0', icon: TrendingDown },
  { label: 'Sessions', value: '0', icon: LineChart },
];

export default function Dashboard() {
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
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
              <LineChart className="h-10 w-10 mb-3 opacity-30" />
              <p>Complete your first trading session</p>
              <p className="text-xs">to see your equity curve</p>
            </div>
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
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    No trades yet. Head to the Simulator to start practicing.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}