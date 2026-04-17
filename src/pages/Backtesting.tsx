import HelpSheet from '@/components/HelpSheet';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  FlaskConical, Play, CalendarIcon, TrendingUp, TrendingDown,
  BarChart3, Target, DollarSign, Activity, LineChart, ListChecks, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStrategies } from '@/hooks/useStrategies';
import { useBacktestRuns, useCreateBacktestRun, type BacktestRun } from '@/hooks/useBacktestRuns';
import BacktestRunHistory from '@/components/backtesting/BacktestRunHistory';

const fmtCurrency = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
};

function statusBadge(run: BacktestRun) {
  if (run.status === 'pending' || run.status === 'running') {
    return <Badge variant="outline" className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30">Processing</Badge>;
  }
  if (run.status === 'failed') {
    return <Badge variant="outline" className="bg-red-500/15 text-red-500 border-red-500/30">Failed</Badge>;
  }
  if ((run.net_pnl ?? 0) > 0) {
    return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Profitable</Badge>;
  }
  return <Badge variant="outline" className="bg-red-500/15 text-red-500 border-red-500/30">Unprofitable</Badge>;
}

export default function Backtesting() {
  const [strategyId, setStrategyId] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [initialBalance, setInitialBalance] = useState(10000);
  const [stopLoss, setStopLoss] = useState(10);
  const [takeProfit, setTakeProfit] = useState(20);
  const [maxTrades, setMaxTrades] = useState(5);

  const { strategies, isLoading: strategiesLoading } = useStrategies();
  const { runs, isLoading: runsLoading } = useBacktestRuns();
  const createRun = useCreateBacktestRun();

  const canRun = !!strategyId && !!timeframe && !!startDate && !!endDate && !createRun.isPending;

  const handleRun = () => {
    if (!startDate || !endDate) return;
    const name = strategies.find((s) => s.id === strategyId)?.name ?? '';
    createRun.mutate(
      {
        strategy_id: strategyId,
        strategy_name: name,
        timeframe,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        initial_balance: initialBalance,
        stop_loss_ticks: stopLoss,
        take_profit_ticks: takeProfit,
        max_trades_per_day: maxTrades,
      },
      {
        onSuccess: () => toast.success('Backtest queued — results will appear here when the engine runs.'),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to queue backtest'),
      },
    );
  };

  const current = runs[0];
  const isProcessing = current && (current.status === 'pending' || current.status === 'running');
  const isComplete = current && current.status === 'complete';

  const metrics = current
    ? [
        { label: 'Net P&L', value: fmtCurrency(current.net_pnl), icon: DollarSign, positive: (current.net_pnl ?? 0) >= 0 },
        { label: 'Win Rate', value: current.win_rate != null ? `${current.win_rate.toFixed(0)}%` : '—', icon: Target, positive: true },
        { label: 'Total Trades', value: current.total_trades?.toString() ?? '—', icon: Activity, positive: null },
        { label: 'Max Drawdown', value: fmtCurrency(current.max_drawdown), icon: TrendingDown, positive: false },
        { label: 'Avg Winner', value: fmtCurrency(current.avg_winner), icon: TrendingUp, positive: true },
        { label: 'Avg Loser', value: fmtCurrency(current.avg_loser), icon: TrendingDown, positive: false },
        { label: 'Profit Factor', value: current.profit_factor != null ? current.profit_factor.toFixed(2) : '—', icon: BarChart3, positive: true },
        { label: 'Sharpe Ratio', value: '—', icon: Activity, positive: null },
      ]
    : [];

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
            <p className="text-xs text-muted-foreground mt-1">Test strategies against historical data.</p>
          </div>
          <HelpSheet pageName="Backtesting" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Strategy</Label>
              {strategiesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={strategyId} onValueChange={setStrategyId}>
                  <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue placeholder="Select timeframe" /></SelectTrigger>
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

            <div className="space-y-1.5">
              <Label className="text-xs">Initial Balance ($)</Label>
              <Input type="number" value={initialBalance} onChange={(e) => setInitialBalance(Number(e.target.value))} className="text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stop Loss (ticks)</Label>
                <Input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Take Profit (ticks)</Label>
                <Input type="number" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))} className="text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Max Trades Per Day</Label>
              <Input type="number" value={maxTrades} onChange={(e) => setMaxTrades(Number(e.target.value))} className="text-sm" />
            </div>

            <Button className="w-full gap-2 mt-2" disabled={!canRun} onClick={handleRun}>
              {createRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {createRun.isPending ? 'Queuing...' : 'Run Backtest'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {runsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : runs.length === 0 ? (
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
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Backtest Results</h2>
                <p className="text-xs text-muted-foreground">
                  {current!.strategy_name} · {current!.timeframe} · {format(new Date(current!.start_date), 'MMM d')} – {format(new Date(current!.end_date), 'MMM d, yyyy')}
                </p>
              </div>
              {statusBadge(current!)}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {isProcessing
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                : metrics.map((m) => (
                    <Card key={m.label}>
                      <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{m.label}</span>
                          <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className={cn('text-lg font-bold',
                          m.positive === true && 'text-emerald-500',
                          m.positive === false && 'text-red-500',
                          m.positive === null && 'text-foreground')}>
                          {m.value}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-primary" />Equity Curve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                    {isComplete ? 'Chart will render here' : 'Engine output pending'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />Trade Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                    {isComplete ? 'Trade list will render here' : 'Engine output pending'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <BacktestRunHistory runs={runs} />
          </>
        )}
      </div>
    </div>
  );
}
