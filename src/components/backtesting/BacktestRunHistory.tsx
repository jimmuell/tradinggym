import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import BacktestKpiCards from './BacktestKpiCards';
import BacktestVerdictPanel from './BacktestVerdictPanel';
import BacktestTradeSummary from './BacktestTradeSummary';

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

function isActiveRun(r: BacktestRun) {
  return r.status === 'pending' || r.status === 'running';
}

function statusBadge(run: BacktestRun) {
  if (isActiveRun(run)) {
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
  | { kind: 'bulk'; ids: string[] }
  | null;

export default function BacktestRunHistory({ runs }: Props) {
  const deleteRun = useDeleteBacktestRun();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const previous = useMemo(() => runs.slice(0, 11), [runs]);
  const failedRuns = useMemo(() => previous.filter((r) => r.status === 'failed'), [previous]);
  const eligibleIds = useMemo(() => previous.filter((r) => !isActiveRun(r)).map((r) => r.id), [previous]);

  // Prune stale selections after deletions / refetches
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(eligibleIds);
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [eligibleIds]);

  if (previous.length === 0) return null;

  const selectedCount = selectedIds.size;
  const allSelected = eligibleIds.length > 0 && selectedCount === eligibleIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(eligibleIds));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'single') {
        await deleteRun.mutateAsync(confirm.runId);
        toast.success('Backtest run deleted');
      } else if (confirm.kind === 'failed') {
        await Promise.all(failedRuns.map((r) => deleteRun.mutateAsync(r.id)));
        toast.success('Failed runs cleared');
      } else {
        await Promise.all(confirm.ids.map((id) => deleteRun.mutateAsync(id)));
        toast.success(`${confirm.ids.length} run${confirm.ids.length === 1 ? '' : 's'} deleted`);
        setSelectedIds(new Set());
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
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm">Previous Runs</CardTitle>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setConfirm({ kind: 'bulk', ids: Array.from(selectedIds) })}
              >
                <Trash2 className="mr-1 !size-3.5" />
                Delete selected ({selectedCount})
              </Button>
            )}
            {failedRuns.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirm({ kind: 'failed', count: failedRuns.length })}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Clear failed runs
              </button>
            )}
            {eligibleIds.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all runs"
                />
                Select all
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {previous.map((run) => {
            const active = isActiveRun(run);
            const canExpand = run.status === 'complete';
            const isExpanded = expandedId === run.id;
            const checked = selectedIds.has(run.id);
            return (
              <div key={run.id} className="border border-border rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm px-3 py-2">
                  <Checkbox
                    checked={checked}
                    disabled={active}
                    onCheckedChange={() => toggleOne(run.id)}
                    aria-label={`Select run ${run.strategy_name}`}
                    className="shrink-0"
                  />
                  {canExpand ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : run.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                      className="flex items-center gap-2 min-w-0 flex-1 basis-40 text-left hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{run.strategy_name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {run.timeframe} · {formatRange(run.start_date, run.end_date)} · Ran {format(new Date(run.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col min-w-0 flex-1 basis-40 pl-6">
                      <span className="font-medium text-foreground truncate">{run.strategy_name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {run.timeframe} · {formatRange(run.start_date, run.end_date)} · Ran {format(new Date(run.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
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
                    {!active && (
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
                {canExpand && isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-3 py-3 space-y-3">
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
                    <BacktestTradeSummary
                      wins={run.wins}
                      losses={run.losses}
                      avgWinner={run.avg_winner}
                      avgLoser={run.avg_loser}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'failed'
                ? 'Clear failed backtest runs?'
                : confirm?.kind === 'bulk'
                  ? `Delete ${confirm.ids.length} backtest run${confirm.ids.length === 1 ? '' : 's'}?`
                  : 'Delete backtest run?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'failed'
                ? `This will permanently delete ${confirm.count} failed run${confirm.count === 1 ? '' : 's'} from your history. This action cannot be undone.`
                : confirm?.kind === 'bulk'
                  ? `This will permanently delete ${confirm.ids.length} selected run${confirm.ids.length === 1 ? '' : 's'}. This action cannot be undone.`
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
