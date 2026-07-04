import { useState, useEffect } from 'react';

function useElapsedSeconds(startIso: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
import { format } from 'date-fns';
import { Beaker, AlertTriangle, RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import BacktestKpiCards from './BacktestKpiCards';
import BacktestVerdictPanel from './BacktestVerdictPanel';
import BacktestTradeSummary from './BacktestTradeSummary';
import BacktestExplainPanel from './BacktestExplainPanel';
import { formatRuntime } from '@/lib/formatRuntime';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface Props {
  run: BacktestRun | null;
  onRetry?: () => void;
  onCancel?: () => void;
  isCanceling?: boolean;
}


export default function BacktestResultsPanel({ run, onRetry, onCancel, isCanceling }: Props) {
  const [collapsed, setCollapsed] = useState(false);
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
    return <InProgressCard run={run} onCancel={onCancel} isCanceling={isCanceling} />;
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
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 w-full text-left hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm flex-1">
            Latest Run · {run.strategy_name}
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">
            {format(new Date(run.created_at), 'MMM d, yyyy · h:mm a')}
          </span>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4">
          <BacktestKpiCards
            netPnl={run.net_pnl}
            winRate={run.win_rate}
            profitFactor={run.profit_factor}
            maxDrawdown={run.max_drawdown}
            totalTrades={run.total_trades}
          />

          <p className="text-xs text-muted-foreground">
            Engine v{run.engine_version || '?'} · Runtime:{' '}
            {formatRuntime(run.execution_time_ms) ?? '?'}
            {run.estimated_runtime_ms != null && (
              <span className="opacity-80"> · estimated ~{formatRuntime(run.estimated_runtime_ms)}</span>
            )}
            {' · '}{run.direction || 'long_short'}
          </p>

          <BacktestVerdictPanel run={run} />

          <BacktestTradeSummary
            wins={run.wins}
            losses={run.losses}
            avgWinner={run.avg_winner}
            avgLoser={run.avg_loser}
          />

          <BacktestExplainPanel run={run} />
        </CardContent>
      )}
    </Card>
  );
}

function InProgressCard({
  run,
  onCancel,
  isCanceling,
}: {
  run: BacktestRun;
  onCancel?: () => void;
  isCanceling?: boolean;
}) {
  const elapsed = useElapsedSeconds(run.created_at);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>Backtesting in progress</span>
          <span className="text-muted-foreground font-normal tabular-nums">· {formatElapsed(elapsed)}</span>
        </CardTitle>
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
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCanceling}
            className="gap-2"
          >
            {isCanceling ? 'Canceling…' : 'Cancel job'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
