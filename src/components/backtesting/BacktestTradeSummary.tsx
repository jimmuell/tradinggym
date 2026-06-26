import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  wins: number | null;
  losses: number | null;
  avgWinner: number | null;
  avgLoser: number | null;
}

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function BacktestTradeSummary({ wins, losses, avgWinner, avgLoser }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Trade Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Winning Trades</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums text-emerald-500 truncate">{wins ?? 0}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Losing Trades</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums text-red-500 truncate">{losses ?? 0}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Avg Winner</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums text-emerald-500 truncate" title={formatCurrency(avgWinner)}>{formatCurrency(avgWinner)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Avg Loser</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums text-red-500 truncate" title={formatCurrency(avgLoser)}>{formatCurrency(avgLoser)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
