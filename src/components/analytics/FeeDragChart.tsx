import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { FeeDragPoint } from '@/hooks/useSessionAnalytics';

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  data: FeeDragPoint[];
}

export function FeeDragChart({ data }: Props) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            formatter={(v: number) => [`${Number(v).toFixed(1)}%`, 'Fee Drag']}
            labelFormatter={(l: string) => formatShortDate(l)}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine y={30} stroke="#9ca3af" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="feeDrag" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
