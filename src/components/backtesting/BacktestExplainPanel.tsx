import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface Props {
  run: BacktestRun;
}

function money(n: number | null): string {
  if (n === null) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

export default function BacktestExplainPanel({ run }: Props) {
  const d = (run.results_detail ?? {}) as Record<string, unknown>;

  const num = (k: string): number | null => {
    const v = Number(d[k]);
    return Number.isFinite(v) ? v : null;
  };
  const str = (k: string): string | null => (typeof d[k] === 'string' ? (d[k] as string) : null);

  const total = run.total_trades ?? num('total_trades') ?? 0;
  const sl = num('sl_exit_count');
  const tp = num('tp_exit_count');
  const hasExitData = sl !== null && tp !== null;
  const slCount = sl ?? 0;
  const tpCount = tp ?? 0;
  const signalCount = Math.max(0, total - slCount - tpCount);

  const recvStopPct = num('received_stop_loss_pct');
  const recvTpPct = num('received_take_profit_pct');
  const recvStopPoints = num('received_stop_loss_points');
  const recvTpPoints = num('received_take_profit_points');

  const noStopTargetConfigured =
    (recvStopPct ?? 0) === 0 &&
    (recvTpPct ?? 0) === 0 &&
    (recvStopPoints ?? 0) === 0 &&
    (recvTpPoints ?? 0) === 0;

  const noEngineExitTrades = slCount + tpCount === 0;

  // Engine exits are genuinely off only when nothing was configured AND no SL/TP exits occurred.
  const engineExitsOff = noStopTargetConfigured && noEngineExitTrades;


  const grossProfit = num('gross_profit');
  const grossLoss = num('gross_loss');
  const winLossRatio = num('avg_win_loss_ratio');
  const largestWin = num('largest_winning');
  const largestLoss = num('largest_losing');
  const maxConsecWins = num('max_consec_wins');
  const maxConsecLosses = num('max_consec_losses');
  const totalCommission = num('total_commission');

  const actualStart = str('actual_start_date');
  const actualEnd = str('actual_end_date');

  const exitRows = [
    { label: 'Signal exit', count: signalCount, className: 'text-foreground' },
    { label: 'Take profit', count: tpCount, className: 'text-emerald-500' },
    { label: 'Stop loss', count: slCount, className: 'text-red-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Why this result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exit breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">How trades closed</p>
          {hasExitData ? (
            <>
              <div className="space-y-1.5">
                {exitRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: pct(r.count, total) }}
                      />
                    </div>
                    <span className={`w-20 shrink-0 text-right text-xs tabular-nums ${r.className}`}>
                      {r.count} · {pct(r.count, total)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Signal exits close at the next bar's open before the engine's stop/target check,
                so an engine stop only binds when price crosses it intrabar on a bar with no pending
                signal exit.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Exit breakdown isn't available for this run (it predates exit instrumentation). Re-run
              the backtest to capture it.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {engineExitsOff
              ? 'Engine stop/target were off for this run — exits are strategy-managed.'
              : `Engine risk applied: stop ${recvStopPoints ? `${recvStopPoints} pts` : `${recvStopPct ?? 0}%`} · target ${recvTpPoints ? `${recvTpPoints} pts` : `${recvTpPct ?? 0}%`}.`}
          </p>

        </div>

        {/* Composition */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <Stat label="Gross profit" value={money(grossProfit)} className="text-emerald-500" />
          <Stat label="Gross loss" value={money(grossLoss)} className="text-red-500" />
          <Stat
            label="Win/loss size"
            value={winLossRatio !== null ? `${winLossRatio.toFixed(2)}×` : '—'}
          />
          <Stat label="Commission" value={money(totalCommission)} />
          <Stat label="Largest win" value={money(largestWin)} className="text-emerald-500" />
          <Stat label="Largest loss" value={money(largestLoss)} className="text-red-500" />
          <Stat
            label="Max win streak"
            value={maxConsecWins !== null ? String(maxConsecWins) : '—'}
          />
          <Stat
            label="Max loss streak"
            value={maxConsecLosses !== null ? String(maxConsecLosses) : '—'}
          />
        </div>

        {(actualStart || actualEnd) && (
          <p className="text-[11px] text-muted-foreground">
            Data actually covered: {actualStart ?? '?'} → {actualEnd ?? '?'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-semibold tabular-nums ${className ?? ''}`} title={value}>
        {value}
      </p>
    </div>
  );
}
