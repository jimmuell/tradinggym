import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DailyPnlPoint } from '@/hooks/useAnalytics';

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  data: DailyPnlPoint[];
}

export function DailyPnlChart({ data }: Props) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `$${v.toFixed(0)}`} tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
            labelFormatter={(l: string) => formatShortDate(l)}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="pnl">
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
