import { useMemo, useState } from 'react';
import { GitCompare, Check, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

const MAX_SELECT = 3;
const SERIES_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6']; // blue / amber / violet
const STATUS_LABEL: Record<string, string> = {
  pass: 'Promising', caution: 'Caution', fail: 'Fail', inconclusive: 'Inconclusive', info: 'Info',
};
const STATUS_CHIP: Record<string, string> = {
  pass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  caution: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  fail: 'bg-red-500/15 text-red-600 dark:text-red-400',
  inconclusive: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
};

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function pctFmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const v = Math.abs(n) <= 1 ? n * 100 : n; // engine may send 0–1 or 0–100
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}
function plain(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

// Signal identity for the same-signal check: prefer the persisted hash (BT-CMP-0),
// fall back to ai_signal_code for older null-hash runs.
function signalIdentity(run: BacktestRun): string | null {
  return run.signal_hash ?? run.ai_signal_code ?? null;
}

const letter = (i: number) => String.fromCharCode(65 + i); // A, B, C

interface Props {
  runs: BacktestRun[];
}

export default function BacktestComparePanel({ runs }: Props) {
  const completed = useMemo(() => runs.filter((r) => r.status === 'complete'), [runs]);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (completed.length < 2) return null;

  const selectedRuns = selectedIds
    .map((id) => completed.find((r) => r.id === id))
    .filter((r): r is BacktestRun => !!r);

  const colorFor = (id: string) => SERIES_COLORS[Math.max(0, selectedIds.indexOf(id)) % SERIES_COLORS.length];

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSelectedIds([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Compare runs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare backtest runs</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Select 2–{MAX_SELECT} completed runs ({selectedIds.length} selected).
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
            {completed.map((run) => {
              const checked = selectedIds.includes(run.id);
              const disabled = !checked && selectedIds.length >= MAX_SELECT;
              return (
                <label
                  key={run.id}
                  className={cn(
                    'flex items-center gap-2 rounded px-2 py-1.5 text-sm',
                    disabled ? 'opacity-40' : 'cursor-pointer hover:bg-muted/50',
                  )}
                >
                  <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggle(run.id)} />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: checked ? colorFor(run.id) : 'transparent',
                      border: checked ? 'none' : '1px solid hsl(var(--border))',
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {run.strategy_name}
                    <span className="text-muted-foreground"> · {run.start_date} → {run.end_date}</span>
                  </span>
                  <span className={cn('shrink-0 tabular-nums', (run.net_pnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {money(run.net_pnl)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {selectedRuns.length >= 2 ? (
          <Comparison runs={selectedRuns} colorFor={colorFor} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Pick at least two runs to see the comparison.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Comparison({ runs, colorFor }: { runs: BacktestRun[]; colorFor: (id: string) => string }) {
  // --- Same-signal banner ---
  const ids = runs.map(signalIdentity);
  const allKnown = ids.every((x) => x !== null);
  const sameSignal = allKnown && ids.every((x) => x === ids[0]);

  // --- Diff strip ---
  const fields: { label: string; get: (r: BacktestRun) => string }[] = [
    { label: 'Strategy', get: (r) => r.strategy_name },
    { label: 'Timeframe', get: (r) => r.timeframe },
    { label: 'Date range', get: (r) => `${r.start_date} → ${r.end_date}` },
    { label: 'Direction', get: (r) => r.direction || 'long_short' },
    { label: 'Stop loss %', get: (r) => plain(r.stop_loss_pct ?? null) },
    { label: 'Take profit %', get: (r) => plain(r.take_profit_pct ?? null) },
    { label: 'Position size', get: (r) => plain(r.qty_value ?? null, 0) },
    { label: 'Commission %', get: (r) => plain(r.commission_pct ?? null) },
    { label: 'Initial balance', get: (r) => money(r.initial_balance) },
  ];
  const diffRows = fields
    .map((f) => ({ label: f.label, vals: runs.map(f.get) }))
    .filter((row) => !row.vals.every((v) => v === row.vals[0]));
  const identicalCount = fields.length - diffRows.length;

  // --- KPI table (best-in-row highlight) ---
  type Better = 'high' | 'low' | 'none';
  const kpis: { label: string; vals: (number | null)[]; fmt: (n: number | null) => string; better: Better }[] = [
    { label: 'Net P&L', vals: runs.map((r) => r.net_pnl), fmt: money, better: 'high' },
    { label: 'Win rate', vals: runs.map((r) => r.win_rate), fmt: pctFmt, better: 'high' },
    { label: 'Profit factor', vals: runs.map((r) => r.profit_factor), fmt: (n) => plain(n, 2), better: 'high' },
    { label: 'Max drawdown', vals: runs.map((r) => r.max_drawdown), fmt: pctFmt, better: 'low' },
    { label: 'Trades', vals: runs.map((r) => r.total_trades), fmt: (n) => plain(n, 0), better: 'none' },
    { label: 'Avg winner', vals: runs.map((r) => r.avg_winner), fmt: money, better: 'high' },
    { label: 'Avg loser', vals: runs.map((r) => r.avg_loser), fmt: money, better: 'high' },
  ];
  const bestIndex = (vals: (number | null)[], better: Better): number => {
    if (better === 'none') return -1;
    let best = -1;
    let bestVal = better === 'high' ? -Infinity : Infinity;
    vals.forEach((v, i) => {
      if (v === null || v === undefined) return;
      if ((better === 'high' && v > bestVal) || (better === 'low' && v < bestVal)) {
        bestVal = v;
        best = i;
      }
    });
    return best;
  };

  // --- Equity overlay (normalized % return, indexed to each run's start) ---
  const equityData = useMemo(() => {
    const byTs = new Map<string, Record<string, number | string>>();
    runs.forEach((r) => {
      const curve = r.equity_curve ?? [];
      const base = curve[0]?.equity ?? r.initial_balance ?? null;
      curve.forEach((pt) => {
        if (!pt?.timestamp) return;
        const ret = base && base !== 0 ? (pt.equity / base - 1) * 100 : null;
        const row = byTs.get(pt.timestamp) ?? { timestamp: pt.timestamp };
        if (ret !== null) row[r.id] = ret;
        byTs.set(pt.timestamp, row);
      });
    });
    return Array.from(byTs.values()).sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  }, [runs]);
  const hasEquity = equityData.some((row) => runs.some((r) => typeof row[r.id] === 'number'));

  // --- Net P&L bars ---
  const pnlData = runs.map((r, i) => ({ name: letter(i), id: r.id, pnl: r.net_pnl ?? 0 }));

  return (
    <div className="space-y-5">
      {/* Same-signal banner */}
      <div
        className={cn(
          'flex items-start gap-2 rounded-md border p-3 text-sm',
          sameSignal
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        )}
      >
        {sameSignal ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>
          {sameSignal
            ? 'These runs use the same signal — differences below come only from the parameters that changed.'
            : allKnown
              ? 'These runs use different signals — not directly comparable; differences may reflect different entry logic, not just parameters.'
              : 'Signal identity is unknown for one or more older runs — treat this comparison with caution.'}
        </span>
      </div>

      {/* Run legend */}
      <div className="flex flex-wrap gap-3">
        {runs.map((r, i) => (
          <div key={r.id} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorFor(r.id) }} />
            <span className="font-medium">{letter(i)}</span>
            <span className="text-muted-foreground truncate max-w-[180px]">{r.strategy_name}</span>
          </div>
        ))}
      </div>

      {/* Diff strip */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">What changed</p>
        {diffRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">All compared inputs are identical.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {diffRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">{row.label}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className="py-1.5 pr-3 tabular-nums">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {identicalCount > 0 && (
          <p className="text-[11px] text-muted-foreground">{identicalCount} other settings identical.</p>
        )}
      </div>

      {/* KPI table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-1.5 pr-3 text-left text-xs font-medium text-muted-foreground">Metric</th>
              {runs.map((r, i) => (
                <th key={r.id} className="py-1.5 pr-3 text-right text-xs font-semibold" style={{ color: colorFor(r.id) }}>
                  {letter(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.map((row) => {
              const best = bestIndex(row.vals, row.better);
              return (
                <tr key={row.label} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        'py-1.5 pr-3 text-right tabular-nums',
                        i === best && 'font-semibold text-foreground',
                      )}
                    >
                      {row.fmt(v)}
                      {i === best && <span className="ml-1 text-[10px] text-emerald-500">best</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Net P&L bars */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Net P&amp;L</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${v.toFixed(0)}`} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={(v: number) => [money(v), 'Net P&L']} contentStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {pnlData.map((d) => (
                  <Cell key={d.id} fill={colorFor(d.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equity overlay */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Equity curve (% return, indexed to each run's start)</p>
        {hasEquity ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '')}
                  minTickGap={32}
                />
                <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} width={48} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                  labelFormatter={(l: string) => (l ? new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
                  contentStyle={{ fontSize: 12 }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {runs.map((r, i) => (
                  <Line
                    key={r.id}
                    type="monotone"
                    dataKey={r.id}
                    name={letter(i)}
                    stroke={colorFor(r.id)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No equity-curve data available for these runs.</p>
        )}
      </div>

      {/* Verdicts */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Validation verdict</p>
        <div className="flex flex-wrap gap-3">
          {runs.map((r, i) => {
            const status = r.validation?.overall ?? null;
            return (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium" style={{ color: colorFor(r.id) }}>{letter(i)}</span>
                {status ? (
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_CHIP[status] ?? 'bg-muted text-muted-foreground')}>
                    {STATUS_LABEL[status] ?? status}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No verdict</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
