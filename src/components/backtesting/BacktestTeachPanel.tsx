import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTier } from '@/contexts/TierContext';
import type { BacktestRun } from '@/hooks/useBacktestRuns';
import CoachChat from './CoachChat';
import { COACH_CHAT_ENABLED } from '@/lib/featureFlags';

interface TeachingEntry {
  dimension: string;
  delta_net: number;
  direction: string;
  significance: string;
  delta_ci_low: number;
  delta_ci_high: number;
  trade_count: number;
  sufficient_data: boolean;
  // stop-specific
  primary_worst_loss?: number;
  variant_worst_loss?: number;
  // take-profit-specific
  primary_best_win?: number;
  variant_best_win?: number;
  n_resamples?: number;
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

function Shell({
  title,
  children,
  adminToggle,
}: {
  title: string;
  children: React.ReactNode;
  adminToggle?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            {title}
          </CardTitle>
          {adminToggle}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function StopCardBody({ t }: { t: TeachingEntry }) {
  if (t.sufficient_data === false) {
    return (
      <>
        <p>Not enough trades to tell what your stop did here.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  if (t.significance === 'inconclusive') {
    return (
      <>
        <p>Your stop made no meaningful difference here — the change is within normal noise.</p>
        <p className="text-xs text-muted-foreground">
          Worst loss with the stop: {signedDollars(t.primary_worst_loss ?? 0)}. Without it:{' '}
          {signedDollars(t.variant_worst_loss ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  if (t.significance === 'saved') {
    return (
      <>
        <p>
          Your stop <strong>SAVED</strong> you {dollars(t.delta_net)} over {t.trade_count} trades.
        </p>
        <p className="text-xs text-muted-foreground">
          Worst loss with the stop: {signedDollars(t.primary_worst_loss ?? 0)}. Without it:{' '}
          {signedDollars(t.variant_worst_loss ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  if (t.significance === 'cost') {
    return (
      <>
        <p>
          Your stop <strong>COST</strong> you {dollars(t.delta_net)} over {t.trade_count} trades.
        </p>
        <p className="text-xs text-muted-foreground">It closed some trades that later recovered.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  return <p>We couldn't produce a reliable comparison for this run.</p>;
}

function TakeProfitCardBody({ t }: { t: TeachingEntry }) {
  if (t.sufficient_data === false) {
    return (
      <>
        <p>Not enough trades to tell what your take-profit did here.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  const hasRealWinner = (t.primary_best_win ?? 0) > 0;
  const winnerLine = hasRealWinner ? (
    <p className="text-xs text-muted-foreground">
      Biggest winner you locked in: {signedDollars(t.primary_best_win ?? 0)}. Without the cap, that
      trade would have reached {signedDollars(t.variant_best_win ?? 0)}.
    </p>
  ) : (
    <p className="text-xs text-muted-foreground">
      No winning trades in this run, so there were no capped winners to measure.
    </p>
  );

  if (t.significance === 'inconclusive') {
    return (
      <>
        <p>Your take-profit made no meaningful difference here — within normal noise.</p>
        {winnerLine}
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  if (t.significance === 'cost') {
    return (
      <>
        <p>
          Your take-profit left money on the table — winners that would have run further got
          capped. Letting them run would have made about {dollars(t.delta_net)} more across these
          trades.
        </p>
        {winnerLine}
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  if (t.significance === 'saved') {
    return (
      <>
        <p>
          Your take-profit locked in gains before trades reversed — without it you'd have given
          back about {dollars(t.delta_net)}.
        </p>
        {winnerLine}
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  return <p>We couldn't produce a reliable comparison for this run.</p>;
}

function titleFor(dimension: string): string {
  if (dimension === 'stop') return 'What your stop did';
  if (dimension === 'take_profit') return 'What your take-profit did';
  return `What your ${dimension.replace(/_/g, ' ')} did`;
}

export default function BacktestTeachPanel({ run }: Props) {
  const { isAdmin } = useTier();
  const [mockMode, setMockMode] = useState(false);

  if (!run) return null;

  const hasStopConfig =
    Number(run.stop_loss_points ?? 0) > 0 || Number(run.stop_loss_pct ?? 0) > 0;
  if (!hasStopConfig) return null;

  const detail = (run.results_detail ?? {}) as Record<string, unknown>;
  const rawTeaching = detail._teaching ?? (detail as { teaching?: unknown }).teaching;
  const teachingArr: TeachingEntry[] | undefined = Array.isArray(rawTeaching)
    ? (rawTeaching as TeachingEntry[])
    : rawTeaching && typeof rawTeaching === 'object'
      ? [rawTeaching as TeachingEntry]
      : undefined;
  const sameSignal = detail._same_signal as boolean | undefined;

  if (!teachingArr || teachingArr.length === 0) return null;

  const adminToggle = isAdmin ? (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Label htmlFor="coach-mock-toggle" className="text-xs cursor-pointer">
        Coach: {mockMode ? 'Mock (no API cost)' : 'Live'}
      </Label>
      <Switch
        id="coach-mock-toggle"
        checked={mockMode}
        onCheckedChange={setMockMode}
        aria-label="Toggle coach mock mode"
      />
    </div>
  ) : null;

  // Broken comparison — show a single honest card.
  if (sameSignal !== true) {
    return (
      <Shell title="What your stop did" adminToggle={adminToggle}>
        <p>We couldn't produce a reliable comparison for this run.</p>
      </Shell>
    );
  }

  const stopBlock = teachingArr.find((x) => x.dimension === 'stop');

  // Build coach card message from the stop block (coach is gated; payload unchanged).
  const buildCardMessage = (t: TeachingEntry): string => {
    if (t.significance === 'inconclusive') {
      return `Your stop made no meaningful difference here — within normal noise. Worst loss with the stop: ${signedDollars(t.primary_worst_loss ?? 0)}. Without it: ${signedDollars(t.variant_worst_loss ?? 0)}.`;
    }
    if (t.significance === 'saved') {
      return `Your stop SAVED you ${dollars(t.delta_net)} over ${t.trade_count} trades. Worst loss with the stop: ${signedDollars(t.primary_worst_loss ?? 0)}. Without it: ${signedDollars(t.variant_worst_loss ?? 0)}.`;
    }
    if (t.significance === 'cost') {
      return `Your stop COST you ${dollars(t.delta_net)} over ${t.trade_count} trades.`;
    }
    return '';
  };

  const showCoach = COACH_CHAT_ENABLED || isAdmin;

  return (
    <div className="space-y-4">
      {teachingArr.map((t, idx) => {
        const isFirst = idx === 0;
        const title = titleFor(t.dimension);
        const body =
          t.dimension === 'take_profit' ? (
            <TakeProfitCardBody t={t} />
          ) : (
            <StopCardBody t={t} />
          );

        // Attach coach + admin toggle only to the stop card (first card), preserving prior behavior.
        const isStop = t.dimension === 'stop';
        const toggle = isStop ? adminToggle : undefined;
        const coach =
          isStop && showCoach && stopBlock ? (
            <CoachChat
              run={run}
              teaching={stopBlock as never}
              sameSignal={sameSignal === true}
              cardMessage={buildCardMessage(stopBlock)}
              mockMode={isAdmin && mockMode}
            />
          ) : null;

        return (
          <Shell key={`${t.dimension}-${idx}`} title={title} adminToggle={toggle}>
            {body}
            {coach}
          </Shell>
        );
      })}
    </div>
  );
}
