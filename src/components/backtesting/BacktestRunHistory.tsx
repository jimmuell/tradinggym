import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useDeleteBacktestRun, type BacktestRun } from '@/hooks/useBacktestRuns';

/** Parse a YYYY-MM-DD string as a local date (no UTC timezone shift). */
function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatRange(startYmd: string, endYmd: string): string {
  const start = parseYmdLocal(startYmd);
  const end = parseYmdLocal(endYmd);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt = sameYear ? format(start, 'MMM d') : format(start, 'MMM d, yyyy');
  return `${startFmt} – ${format(end, 'MMM d, yyyy')}`;
}

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

type ConfirmState =
  | { kind: 'single'; runId: string; strategyName: string }
  | { kind: 'failed'; count: number }
  | null;

export default function BacktestRunHistory({ runs }: Props) {
  const deleteRun = useDeleteBacktestRun();
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  if (runs.length <= 1) return null;
  const previous = runs.slice(1, 11);
  const failedRuns = previous.filter((r) => r.status === 'failed');

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'single') {
        await deleteRun.mutateAsync(confirm.runId);
        toast.success('Backtest run deleted');
      } else {
        await Promise.all(failedRuns.map((r) => deleteRun.mutateAsync(r.id)));
        toast.success('Failed runs cleared');
      }
    } catch (err) {
      toast.error(`Delete failed: ${(err as Error).message}`);
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Previous Runs</CardTitle>
          {failedRuns.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'failed', count: failedRuns.length })}
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
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm border border-border rounded-md px-3 py-2"
              >
                <div className="flex flex-col min-w-0 flex-1 basis-40">
                  <span className="font-medium text-foreground truncate">{run.strategy_name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {run.timeframe} · {format(new Date(run.start_date), 'MMM d')} – {format(new Date(run.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                  {statusBadge(run)}
                  <span
                    className={cn(
                      'font-semibold tabular-nums text-right whitespace-nowrap',
                      (run.net_pnl ?? 0) > 0 && 'text-emerald-500',
                      (run.net_pnl ?? 0) < 0 && 'text-red-500',
                    )}
                  >
                    {formatCurrency(run.net_pnl)}
                  </span>
                  {run.execution_time_ms && (
                    <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
                      {(run.execution_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  {!isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setConfirm({ kind: 'single', runId: run.id, strategyName: run.strategy_name })
                      }
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

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'failed' ? 'Clear failed backtest runs?' : 'Delete backtest run?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'failed'
                ? `This will permanently delete ${confirm.count} failed run${confirm.count === 1 ? '' : 's'} from your history. This action cannot be undone.`
                : confirm?.kind === 'single'
                  ? `This will permanently delete the run for "${confirm.strategyName}". This action cannot be undone.`
                  : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRun.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={deleteRun.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRun.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
