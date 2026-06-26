import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  BacktestRun,
  ValidationFinding,
  ValidationStatus,
} from '@/hooks/useBacktestRuns';

interface Props {
  run: BacktestRun;
}

// Color-coding per the engine's status vocabulary. We deliberately keep the
// labels restrained — the pass state is "Promising", never "PASS" — so the UI
// never overclaims beyond what the engine actually returns.
const STATUS_STYLES: Record<
  ValidationStatus,
  { label: string; badge: string; chip: string }
> = {
  pass: {
    label: 'Promising',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  caution: {
    label: 'Caution',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  fail: {
    label: 'Fail',
    badge: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    chip: 'bg-red-500/15 text-red-600 dark:text-red-400',
  },
  inconclusive: {
    label: 'Inconclusive',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    chip: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  },
  info: {
    label: 'Info',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    chip: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
};

function styleFor(status: string) {
  return STATUS_STYLES[status as ValidationStatus] ?? {
    label: status,
    badge: 'bg-muted text-muted-foreground border-border',
    chip: 'bg-muted text-muted-foreground',
  };
}

function StatusChip({ status }: { status: string }) {
  const s = styleFor(status);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', s.chip)}>
      {s.label}
    </span>
  );
}

function fmtNum(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtCurrency(n: number) {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Engines vary between reporting win_rate as a 0–1 fraction or a 0–100 percent;
// display-only normalisation, value itself is shown unchanged from the engine.
function fmtPct(n: number) {
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

function FindingCard({ finding }: { finding: ValidationFinding }) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{finding.title}</p>
        <StatusChip status={finding.status} />
      </div>
      {finding.headline && (
        <p className="text-sm text-foreground/90">{finding.headline}</p>
      )}
      {finding.detail && (
        <p className="text-xs text-muted-foreground break-words">{finding.detail}</p>
      )}
      {finding.stat !== null && finding.stat !== undefined && (
        <p className="text-xs text-muted-foreground tabular-nums">stat: {fmtNum(finding.stat)}</p>
      )}
    </div>
  );
}

export default function BacktestVerdictPanel({ run }: Props) {
  const validation = run.validation;
  const validationError = run.validation_error;

  // Older runs predate the verdict capture — stay quiet rather than imply a result.
  if (!validation && !validationError) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">No validation verdict for this run.</p>
        </CardContent>
      </Card>
    );
  }

  const overall = validation ? styleFor(validation.overall) : null;
  const schemes = validation ? Object.entries(validation.regimes ?? {}) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Engine Validation Verdict</CardTitle>
          {validation && overall && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold',
                overall.badge,
              )}
              title={`engine status: ${validation.overall}`}
            >
              {overall.label}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* validation_error: surfaced plainly, never hidden */}
        {validationError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 break-words">
            validation could not be computed: {validationError}
          </p>
        )}

        {validation && (
          <>
            {/* Summary — shown verbatim and in full (carries the multiple-testing caveat) */}
            {validation.summary && (
              <p className="text-sm text-foreground/90 whitespace-pre-line break-words">
                {validation.summary}
              </p>
            )}

            {/* Findings */}
            {validation.findings?.length > 0 && (
              <div className="space-y-2">
                {validation.findings.map((f, i) => (
                  <FindingCard key={f.key ?? i} finding={f} />
                ))}
              </div>
            )}

            {/* Regimes — compact per-scheme breakdown */}
            {schemes.length > 0 && (
              <div className="space-y-3">
                {schemes.map(([scheme, data]) => {
                  const regimes = Object.entries(data.per_regime ?? {});
                  if (regimes.length === 0) return null;
                  return (
                    <div key={scheme} className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {scheme}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground text-left">
                              <th className="font-medium py-1 pr-3">Regime</th>
                              <th className="font-medium py-1 px-3 text-right">Trades</th>
                              <th className="font-medium py-1 px-3 text-right">Expectancy</th>
                              <th className="font-medium py-1 px-3 text-right">Win Rate</th>
                              <th className="font-medium py-1 pl-3 text-right">Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regimes.map(([label, r]) => (
                              <tr key={label} className="border-t border-border/60">
                                <td className="py-1 pr-3 text-foreground">{label}</td>
                                <td className="py-1 px-3 text-right tabular-nums">{r.n_trades}</td>
                                <td className="py-1 px-3 text-right tabular-nums">{fmtCurrency(r.expectancy)}</td>
                                <td className="py-1 px-3 text-right tabular-nums">{fmtPct(r.win_rate)}</td>
                                <td
                                  className={cn(
                                    'py-1 pl-3 text-right tabular-nums',
                                    r.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500',
                                  )}
                                >
                                  {fmtCurrency(r.net_profit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Skipped checks */}
            {validation.skipped?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Skipped: {validation.skipped.join(', ')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
