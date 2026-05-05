import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  netPnl: number | null;
  winRate: number | null;
  profitFactor: number | null;
  maxDrawdown: number | null;
  totalTrades: number | null;
}

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Kpi({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('text-2xl font-bold tabular-nums mt-1 text-foreground', valueClassName)}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function BacktestKpiCards({ netPnl, winRate, profitFactor, maxDrawdown, totalTrades }: Props) {
  const pnlClass = (netPnl ?? 0) > 0 ? 'text-emerald-500' : (netPnl ?? 0) < 0 ? 'text-red-500' : '';
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <Kpi label="Net Profit" value={formatCurrency(netPnl)} valueClassName={pnlClass} />
      <Kpi label="Win Rate" value={winRate != null ? `${winRate.toFixed(1)}%` : '—'} />
      <Kpi label="Profit Factor" value={profitFactor != null ? profitFactor.toFixed(2) : '—'} />
      <Kpi label="Max Drawdown" value={maxDrawdown != null ? `${maxDrawdown.toFixed(1)}%` : '—'} valueClassName="text-red-500" />
      <Kpi label="Total Trades" value={totalTrades != null ? String(totalTrades) : '—'} />
    </div>
  );
}
