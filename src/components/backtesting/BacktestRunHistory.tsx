import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeleteBacktestRun, type BacktestRun } from '@/hooks/useBacktestRuns';

interface Props {
  runs: BacktestRun[];
}

function statusBadge(run: BacktestRun) {
  if (run.status === 'pending' || run.status === 'running') {
    return <Badge variant="outline" className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30">Processing</Badge>;
  }
  if (run.status === 'failed') {
    return (
      <Badge
        variant="outline"
        className="bg-red-500/15 text-red-500 border-red-500/30"
        title={run.error_message || 'Unknown error'}
      >
        Failed
      </Badge>
    );
  }
  if ((run.net_pnl ?? 0) > 0) {
    return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Profitable</Badge>;
  }
  return <Badge variant="outline" className="bg-red-500/15 text-red-500 border-red-500/30">Unprofitable</Badge>;
}

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export default function BacktestRunHistory({ runs }: Props) {
  const deleteRun = useDeleteBacktestRun();

  if (runs.length <= 1) return null;
  const previous = runs.slice(1, 11);
  const failedRuns = previous.filter((r) => r.status === 'failed');

  const handleDelete = (runId: string) => {
    if (!window.confirm('Delete this backtest run?')) return;
    deleteRun.mutate(runId, {
      onSuccess: () => toast.success('Backtest run deleted'),
      onError: (err) => toast.error(`Failed to delete: ${(err as Error).message}`),
    });
  };

  const handleClearFailed = async () => {
    if (!window.confirm('Delete all failed backtest runs?')) return;
    try {
      await Promise.all(failedRuns.map((r) => deleteRun.mutateAsync(r.id)));
      toast.success('Failed runs cleared');
    } catch (err) {
      toast.error(`Failed to clear: ${(err as Error).message}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Previous Runs</CardTitle>
        {failedRuns.length > 0 && (
          <button
            type="button"
            onClick={handleClearFailed}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear failed runs
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {previous.map((run) => {
          const isActive = run.status === 'pending' || run.status === 'running';
          return (
            <div
              key={run.id}
              className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">{run.strategy_name}</span>
                <span className="text-xs text-muted-foreground">
                  {run.timeframe} · {format(new Date(run.start_date), 'MMM d')} – {format(new Date(run.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {statusBadge(run)}
                <span
                  className={cn(
                    'font-semibold tabular-nums w-24 text-right',
                    (run.net_pnl ?? 0) > 0 && 'text-emerald-500',
                    (run.net_pnl ?? 0) < 0 && 'text-red-500',
                  )}
                >
                  {formatCurrency(run.net_pnl)}
                </span>
                {run.execution_time_ms && (
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {(run.execution_time_ms / 1000).toFixed(1)}s
                  </span>
                )}
                {!isActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleDelete(run.id)}
                    disabled={deleteRun.isPending}
                    aria-label="Delete run"
                  >
                    <Trash2 className="!size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
