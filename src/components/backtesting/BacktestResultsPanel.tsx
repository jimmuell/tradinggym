import { Beaker, AlertTriangle, RotateCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import BacktestKpiCards from './BacktestKpiCards';
import BacktestVerdictPanel from './BacktestVerdictPanel';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface Props {
  run: BacktestRun | null;
  onRetry?: () => void;
  onCancel?: () => void;
  isCanceling?: boolean;
}

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function BacktestResultsPanel({ run, onRetry }: Props) {
  if (!run) {
    return (
      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Beaker className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Run your first backtest to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  if (run.status === 'pending' || run.status === 'running') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backtesting in progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Backtesting 18 years of data — this may take up to 2 minutes…
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (run.status === 'failed') {
    return (
      <Card className="border-red-500/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Backtest failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground break-words">
            {run.error_message || 'Unknown error'}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RotateCw className="h-4 w-4" /> Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BacktestKpiCards
        netPnl={run.net_pnl}
        winRate={run.win_rate}
        profitFactor={run.profit_factor}
        maxDrawdown={run.max_drawdown}
        totalTrades={run.total_trades}
      />

      <p className="text-xs text-muted-foreground">
        Engine v{run.engine_version || '?'} ·{' '}
        {run.execution_time_ms ? (run.execution_time_ms / 1000).toFixed(1) : '?'}s ·{' '}
        {run.direction || 'long_short'}
      </p>

      <BacktestVerdictPanel run={run} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Trade Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Winning Trades</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-emerald-500 truncate">{run.wins ?? 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Losing Trades</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-red-500 truncate">{run.losses ?? 0}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Avg Winner</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-emerald-500 truncate" title={formatCurrency(run.avg_winner)}>{formatCurrency(run.avg_winner)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Avg Loser</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-red-500 truncate" title={formatCurrency(run.avg_loser)}>{formatCurrency(run.avg_loser)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
