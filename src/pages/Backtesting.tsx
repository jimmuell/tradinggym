import HelpSheet from '@/components/HelpSheet';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  FlaskConical,
  Play,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  DollarSign,
  Activity,
  LineChart,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function Backtesting() {
  const [strategy, setStrategy] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [hasResults] = useState(false);

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 p-6">
      {/* Configuration Sidebar */}
      <div className="w-80 shrink-0 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Backtesting
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Test strategies against historical data.
              </p>
            </div>
            <HelpSheet pageName="Backtesting" />
          </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strategy */}
            <div className="space-y-1.5">
              <Label className="text-xs">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orb">Opening Range Breakout</SelectItem>
                  <SelectItem value="amd">AMD</SelectItem>
                  <SelectItem value="vwap">VWAP Mean Reversion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe */}
            <div className="space-y-1.5">
              <Label className="text-xs">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm', !startDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm', !endDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Parameters */}
            <div className="space-y-1.5">
              <Label className="text-xs">Initial Balance ($)</Label>
              <Input type="number" defaultValue={10000} className="text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stop Loss (ticks)</Label>
                <Input type="number" defaultValue={10} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Take Profit (ticks)</Label>
                <Input type="number" defaultValue={20} className="text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Max Trades Per Day</Label>
              <Input type="number" defaultValue={5} className="text-sm" />
            </div>

            <Button className="w-full gap-2 mt-2" disabled={!strategy || !timeframe}>
              <Play className="h-4 w-4" />
              Run Backtest
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {!hasResults ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-5 mb-4">
              <FlaskConical className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Backtest Results</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Configure a strategy, select a date range, and click "Run Backtest" to see how your strategy would have performed on historical data.
            </p>
          </div>
        ) : (
          /* Results Dashboard (placeholder structure for when results exist) */
          <>
            {/* Summary Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Backtest Results</h2>
                <p className="text-xs text-muted-foreground">ORB Strategy · 5m · Jan 1 – Mar 31, 2025</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                Profitable
              </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Net P&L', value: '+$1,250.00', icon: DollarSign, positive: true },
                { label: 'Win Rate', value: '62.5%', icon: Target, positive: true },
                { label: 'Total Trades', value: '48', icon: Activity, positive: null },
                { label: 'Max Drawdown', value: '-$425.00', icon: TrendingDown, positive: false },
                { label: 'Avg Winner', value: '+$85.50', icon: TrendingUp, positive: true },
                { label: 'Avg Loser', value: '-$52.30', icon: TrendingDown, positive: false },
                { label: 'Profit Factor', value: '1.85', icon: BarChart3, positive: true },
                { label: 'Sharpe Ratio', value: '1.42', icon: Activity, positive: true },
              ].map((metric) => (
                <Card key={metric.label}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                      <metric.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className={cn('text-lg font-bold', metric.positive === true && 'text-emerald-500', metric.positive === false && 'text-red-500', metric.positive === null && 'text-foreground')}>
                      {metric.value}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-primary" />
                    Equity Curve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                    Chart will render here
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    Trade Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                    Trade list will render here
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
