import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTier } from '@/contexts/TierContext';
import type { BacktestRun } from '@/hooks/useBacktestRuns';
import CoachChat from './CoachChat';



interface TeachingEntry {
  dimension: string;
  delta_net: number;
  direction: 'saved' | 'cost' | 'neutral' | string;
  primary_worst_loss: number;
  variant_worst_loss: number;
  trade_count: number;
  delta_ci_low: number;
  delta_ci_high: number;
  significance: 'saved' | 'cost' | 'inconclusive' | string;
  n_resamples: number;
  sufficient_data: boolean;
}

interface Props {
  run: BacktestRun | null;
}

function dollars(n: number): string {
  return `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function signedDollars(n: number): string {
  const sign = n >= 0 ? '' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const CAPTION = 'Based on this one historical period — not a prediction.';

// Module-scope to keep component identity stable across parent re-renders
// (otherwise CoachChat unmounts and loses its message state on every render).
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GraduationCap className="size-4 text-primary" />
          What your stop did
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

export default function BacktestTeachPanel({ run }: Props) {
  if (!run) return null;

  // Only render when a stop was actually configured for this run.
  const hasStopConfig =
    Number(run.stop_loss_points ?? 0) > 0 || Number(run.stop_loss_pct ?? 0) > 0;
  if (!hasStopConfig) return null;

  const detail = (run.results_detail ?? {}) as Record<string, unknown>;
  const teachingArr = detail._teaching as TeachingEntry[] | undefined;
  const sameSignal = detail._same_signal as boolean | undefined;

  // No teaching payload at all → nothing to show. (E.g., legacy rows before TEACH-COMPARE.)
  if (!teachingArr || teachingArr.length === 0) return null;

  const t = teachingArr.find((x) => x.dimension === 'stop') ?? teachingArr[0];

  // Shell is defined at module scope below to keep component identity stable
  // across re-renders (prevents CoachChat unmount/state reset).

  // GUARD 1 — broken comparison.
  if (sameSignal !== true || !t || !t.dimension) {
    return (
      <Shell>
        <p>We couldn't produce a reliable comparison for this run.</p>
      </Shell>
    );
  }

  // GUARD 2 — not enough data.
  if (t.sufficient_data === false) {
    return (
      <Shell>
        <p>Not enough trades to tell what your stop did here.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </Shell>
    );
  }

  // Build a plain-text snapshot of the headline message for the coach context.
  const buildCardMessage = (): string => {
    if (t.significance === 'inconclusive') {
      return `Your stop made no meaningful difference here — within normal noise. Worst loss with the stop: ${signedDollars(t.primary_worst_loss)}. Without it: ${signedDollars(t.variant_worst_loss)}.`;
    }
    if (t.significance === 'saved') {
      return `Your stop SAVED you ${dollars(t.delta_net)} over ${t.trade_count} trades. Worst loss with the stop: ${signedDollars(t.primary_worst_loss)}. Without it: ${signedDollars(t.variant_worst_loss)}.`;
    }
    if (t.significance === 'cost') {
      return `Your stop COST you ${dollars(t.delta_net)} over ${t.trade_count} trades.`;
    }
    return '';
  };

  const coach = (
    <CoachChat run={run} teaching={t} sameSignal={sameSignal === true} cardMessage={buildCardMessage()} />
  );

  // GUARD 3 — within noise.
  if (t.significance === 'inconclusive') {
    return (
      <Shell>
        <p>
          Your stop made no meaningful difference here — the change is within normal noise.
        </p>
        <p className="text-xs text-muted-foreground">
          Worst loss with the stop: {signedDollars(t.primary_worst_loss)}. Without it:{' '}
          {signedDollars(t.variant_worst_loss)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
        {coach}
      </Shell>
    );
  }

  // CONFIDENT CASE.
  if (t.significance === 'saved') {
    return (
      <Shell>
        <p>
          Your stop <strong>SAVED</strong> you {dollars(t.delta_net)} over {t.trade_count}{' '}
          trades.
        </p>
        <p className="text-xs text-muted-foreground">
          Worst loss with the stop: {signedDollars(t.primary_worst_loss)}. Without it:{' '}
          {signedDollars(t.variant_worst_loss)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
        {coach}
      </Shell>
    );
  }

  if (t.significance === 'cost') {
    return (
      <Shell>
        <p>
          Your stop <strong>COST</strong> you {dollars(t.delta_net)} over {t.trade_count}{' '}
          trades.
        </p>
        <p className="text-xs text-muted-foreground">
          It closed some trades that later recovered.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
        {coach}
      </Shell>
    );
  }

  // Unknown significance value — treat as broken to stay honest.
  return (
    <Shell>
      <p>We couldn't produce a reliable comparison for this run.</p>
    </Shell>
  );
}
