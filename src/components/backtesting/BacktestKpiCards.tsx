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
  const abs = Math.abs(n);
  const formatted =
    abs >= 10000
      ? abs.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 })
      : abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${sign}$${formatted}`;
}

function fullCurrency(n: number | null) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Kpi({
  label,
  value,
  fullValue,
  valueClassName,
}: {
  label: string;
  value: string;
  fullValue?: string;
  valueClassName?: string;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-3 sm:p-4 min-w-0">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        <p
          className={cn(
            'text-lg sm:text-xl lg:text-2xl font-bold tabular-nums mt-1 text-foreground truncate',
            valueClassName,
          )}
          title={fullValue ?? value}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function BacktestKpiCards({ netPnl, winRate, profitFactor, maxDrawdown, totalTrades }: Props) {
  const pnlClass = (netPnl ?? 0) > 0 ? 'text-emerald-500' : (netPnl ?? 0) < 0 ? 'text-red-500' : '';
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <Kpi label="Net Profit" value={formatCurrency(netPnl)} fullValue={fullCurrency(netPnl)} valueClassName={pnlClass} />
      <Kpi label="Win Rate" value={winRate != null ? `${winRate.toFixed(1)}%` : '—'} />
      <Kpi label="Profit Factor" value={profitFactor != null ? profitFactor.toFixed(2) : '—'} />
      <Kpi label="Max Drawdown" value={maxDrawdown != null ? `${maxDrawdown.toFixed(1)}%` : '—'} valueClassName="text-red-500" />
      <Kpi label="Total Trades" value={totalTrades != null ? String(totalTrades) : '—'} />
    </div>
  );
}
