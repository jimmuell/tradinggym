import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface Props {
  runs: BacktestRun[];
}

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

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export default function BacktestRunHistory({ runs }: Props) {
  if (runs.length <= 1) return null;
  const previous = runs.slice(1, 11);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Previous Runs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {previous.map((run) => (
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
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
