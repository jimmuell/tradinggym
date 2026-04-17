import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { EquityPoint } from '@/hooks/useAnalytics';

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  data: EquityPoint[];
  totalPnl: number;
}

export function EquityCurveChart({ data, totalPnl }: Props) {
  const color = totalPnl >= 0 ? '#22c55e' : '#ef4444';
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `$${v.toFixed(0)}`} tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
            labelFormatter={(l: string) => formatShortDate(l)}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="equity" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
