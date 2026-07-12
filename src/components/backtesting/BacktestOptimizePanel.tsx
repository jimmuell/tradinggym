import { useMemo, useState } from 'react';
import { Sliders, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRunBacktest } from '@/hooks/useRunBacktest';
import { useTier } from '@/contexts/TierContext';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

const MAX_GRID = 8;

type SweepParam = 'stop_loss_pct' | 'take_profit_pct' | 'qty_value';
const PARAM_LABEL: Record<SweepParam, string> = {
  stop_loss_pct: 'Stop loss %',
  take_profit_pct: 'Take profit %',
  qty_value: 'Position size (contracts)',
};

type Objective = 'net_pnl' | 'profit_factor' | 'win_rate' | 'max_drawdown';
const OBJECTIVES: Record<Objective, { label: string; get: (r: BacktestRun) => number | null; better: 'high' | 'low' }> = {
  net_pnl: { label: 'Net P&L', get: (r) => r.net_pnl, better: 'high' },
  profit_factor: { label: 'Profit factor', get: (r) => r.profit_factor, better: 'high' },
  win_rate: { label: 'Win rate', get: (r) => r.win_rate, better: 'high' },
  max_drawdown: { label: 'Max drawdown', get: (r) => r.max_drawdown, better: 'low' },
};

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
  const v = Math.abs(n) <= 1 ? n * 100 : n;
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}
function plain(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function parseValues(text: string, param: SweepParam): number[] {
  const nums = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  let cleaned = nums;
  if (param === 'qty_value') cleaned = nums.map((n) => Math.max(1, Math.trunc(n)));
  if (param === 'stop_loss_pct') cleaned = nums.filter((n) => n <= 100);
  return Array.from(new Set(cleaned)).sort((a, b) => a - b).slice(0, MAX_GRID);
}

interface Props {
  runs: BacktestRun[];
}

export default function BacktestOptimizePanel({ runs }: Props) {
  const { planState, isAdmin, loading: tierLoading } = useTier();
  const runBacktest = useRunBacktest();

  const canOptimize = !tierLoading && (isAdmin || planState === 'expert' || planState === 'guru');
  // Base = most recent completed run that has a strategy_id (so the sweep can regenerate the signal).
  const base = useMemo(
    () => runs.find((r) => r.status === 'complete' && r.strategy_id) ?? null,
    [runs],
  );

  const [open, setOpen] = useState(false);
  const [param, setParam] = useState<SweepParam>('stop_loss_pct');
  const [valuesText, setValuesText] = useState('0, 0.2, 0.4, 0.6');
  const [objective, setObjective] = useState<Objective>('net_pnl');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  // Results: the param values swept and the run ids produced, paired by index.
  const [sweptParam, setSweptParam] = useState<SweepParam>('stop_loss_pct');
  const [sweptValues, setSweptValues] = useState<number[]>([]);
  const [resultIds, setResultIds] = useState<string[]>([]);

  // Hide (render nothing) while plan resolves or the user is ineligible.
  if (tierLoading || !canOptimize || !base) return null;

  const runSweep = async () => {
    const values = parseValues(valuesText, param);
    if (values.length < 2) {
      toast.error('Enter at least 2 distinct values.');
      return;
    }
    setRunning(true);
    setSweptParam(param);
    setSweptValues(values);
    setResultIds([]);
    setProgress({ done: 0, total: values.length });
    const ids: string[] = [];
    try {
      // SEQUENTIAL: first run warms the signal cache; the rest cache-hit the same signal.
      for (const value of values) {
        const res = await runBacktest.mutateAsync({
          strategy_id: base.strategy_id,
          strategy_name: base.strategy_name,
          timeframe: base.timeframe,
          start_date: base.start_date,
          end_date: base.end_date,
          initial_balance: base.initial_balance,
          stop_loss_ticks: 0,
          take_profit_ticks: 0,
          max_trades_per_day: 10,
          direction: base.direction ?? 'long_short',
          commission_pct: base.commission_pct ?? 0.1,
          run_validation: true,
          validation_iterations: 2000,
          stop_loss_pct: param === 'stop_loss_pct' ? value : (base.stop_loss_pct ?? 0),
          take_profit_pct: param === 'take_profit_pct' ? value : (base.take_profit_pct ?? 0),
          qty_value: param === 'qty_value' ? value : (base.qty_value ?? 1),
        });
        if (res?.run_id) ids.push(res.run_id as string);
        setResultIds([...ids]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      toast.success('Sweep complete.');
    } catch (err) {
      toast.error(`Sweep failed: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  // Pair each swept value with its result row (by index), resolved from the live runs list.
  const results = sweptValues.map((value, i) => ({
    value,
    run: resultIds[i] ? runs.find((r) => r.id === resultIds[i]) ?? null : null,
  }));
  const completeResults = results.filter((r) => r.run && r.run.status === 'complete');

  const obj = OBJECTIVES[objective];
  const bestValue = (() => {
    let best: number | null = null;
    let bestScore = obj.better === 'high' ? -Infinity : Infinity;
    completeResults.forEach((r) => {
      const s = obj.get(r.run!);
      if (s === null || s === undefined) return;
      if ((obj.better === 'high' && s > bestScore) || (obj.better === 'low' && s < bestScore)) {
        bestScore = s;
        best = r.value;
      }
    });
    return best;
  })();

  const chartData = completeResults.map((r) => ({ value: r.value, metric: obj.get(r.run!) }));

  // Same-signal check across the completed sweep runs.
  const hashes = completeResults.map((r) => r.run!.signal_hash ?? r.run!.ai_signal_code ?? null);
  const sameSignal = hashes.length > 0 && hashes.every((h) => h !== null && h === hashes[0]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (running) return; // don't close mid-sweep
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sliders className="h-4 w-4" />
          Optimize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Optimize a parameter</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Sweeps one parameter on <span className="font-medium text-foreground">{base.strategy_name}</span>{' '}
          ({base.timeframe} · {base.start_date} → {base.end_date}). All other settings come from your
          most recent run. Runs are deterministic — the swept parameter never changes the signal.
        </p>

        {/* Config */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Parameter</Label>
            <Select value={param} onValueChange={(v) => setParam(v as SweepParam)} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PARAM_LABEL) as SweepParam[]).map((p) => (
                  <SelectItem key={p} value={p}>{PARAM_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Values (comma-separated, max {MAX_GRID})</Label>
            <Input value={valuesText} onChange={(e) => setValuesText(e.target.value)} disabled={running} placeholder="0, 0.2, 0.4, 0.6" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rank by</Label>
            <Select value={objective} onValueChange={(v) => setObjective(v as Objective)} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(OBJECTIVES) as Objective[]).map((o) => (
                  <SelectItem key={o} value={o}>{OBJECTIVES[o].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={runSweep} disabled={running} className="w-full">
          {running ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running {progress.done} of {progress.total}…</>
          ) : (
            <>Run sweep</>
          )}
        </Button>

        {/* Results */}
        {sweptValues.length > 0 && (
          <div className="space-y-4">
            {completeResults.length >= 2 && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-md border p-2.5 text-xs',
                  sameSignal
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                )}
              >
                {sameSignal ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <span>
                  {sameSignal
                    ? 'All sweep runs share one signal — the differences are purely the parameter.'
                    : 'Sweep runs did not all share one signal; interpret with caution.'}
                </span>
              </div>
            )}

            {/* Results table (param-value order; best highlighted) */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-1.5 pr-3 text-left">{PARAM_LABEL[sweptParam]}</th>
                    <th className="py-1.5 pr-3 text-right">Net P&amp;L</th>
                    <th className="py-1.5 pr-3 text-right">PF</th>
                    <th className="py-1.5 pr-3 text-right">Win%</th>
                    <th className="py-1.5 pr-3 text-right">Max DD</th>
                    <th className="py-1.5 pr-3 text-right">Trades</th>
                    <th className="py-1.5 pr-3 text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const isBest = bestValue !== null && r.value === bestValue;
                    const status = r.run?.validation?.overall ?? null;
                    const pending = !r.run || (r.run.status !== 'complete' && r.run.status !== 'failed');
                    const failed = r.run?.status === 'failed';
                    return (
                      <tr key={r.value} className={cn('border-b border-border/50 last:border-0', isBest && 'bg-emerald-500/5')}>
                        <td className="py-1.5 pr-3 tabular-nums">
                          {plain(r.value, sweptParam === 'qty_value' ? 0 : 2)}
                          {isBest && <span className="ml-1 text-[10px] text-emerald-500">best</span>}
                        </td>
                        {pending ? (
                          <td className="py-1.5 pr-3 text-xs text-muted-foreground" colSpan={6}>
                            {failed ? 'failed' : 'running…'}
                          </td>
                        ) : (
                          <>
                            <td className={cn('py-1.5 pr-3 text-right tabular-nums', (r.run!.net_pnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{money(r.run!.net_pnl)}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums">{plain(r.run!.profit_factor, 2)}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums">{pctFmt(r.run!.win_rate)}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums">{pctFmt(r.run!.max_drawdown)}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums">{plain(r.run!.total_trades, 0)}</td>
                            <td className="py-1.5 pr-3 text-right">
                              {status ? (
                                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_CHIP[status] ?? 'bg-muted text-muted-foreground')}>
                                  {STATUS_LABEL[status] ?? status}
                                </span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Response curve: chosen metric vs swept value */}
            {chartData.length >= 2 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {obj.label} vs {PARAM_LABEL[sweptParam].toLowerCase()}
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="value" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={56} />
                      <Tooltip
                        formatter={(v: number) => [objective === 'net_pnl' ? money(v) : objective === 'profit_factor' ? plain(v, 2) : pctFmt(v), obj.label]}
                        labelFormatter={(l: number) => `${PARAM_LABEL[sweptParam]}: ${l}`}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="metric" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A flat plateau around the best value is robust; a lone spike is a sign of overfitting.
                  Cross-check the verdict column before trusting a winner.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
