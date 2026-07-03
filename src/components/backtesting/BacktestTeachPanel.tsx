import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

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
  // commission-specific
  total_commission?: number;
  flips_profitability?: boolean;
  primary_net?: number;
  variant_net?: number;
  // direction-specific
  short_trade_count?: number;
  short_net?: number;
  primary_direction?: string;
  variant_direction?: string;
  // slippage-specific
  total_slippage?: number;
  slippage_ticks?: number;
  // position-size-specific
  contracts?: number;
  qty_type?: string;
  size_multiple?: number;
  primary_max_dd?: number;
  variant_max_dd?: number;
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
          Your take-profit <strong>left money on the table</strong> — winners that would have run further got
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
          Your take-profit <strong>locked in gains</strong> before trades reversed — without it you'd have given
          back about {dollars(t.delta_net)}.
        </p>
        {winnerLine}
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }
  return <p>We couldn't produce a reliable comparison for this run.</p>;
}

// Renders the commission teaching dimension (third card).
function CommissionCardBody({ t }: { t: TeachingEntry }) {
  if (t.sufficient_data === false) {
    return (
      <>
        <p>Not enough trades to measure what commission cost here.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  const total = t.total_commission ?? 0;
  const trades = t.trade_count ?? 0;
  const perTrade = trades > 0 ? total / trades : 0;

  // No commission set — nothing to compare, just a nudge.
  if (total <= 0) {
    return (
      <>
        <p>This run had no commission set, so there's nothing to compare.</p>
        <p className="text-xs text-muted-foreground">
          Real MES trading costs about $1.24 per round-trip, all-in. Add it to see your true P&L.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Headline case: fees turned a winner into a loser.
  if (t.flips_profitability === true) {
    return (
      <>
        <p>
          Commission <strong>flipped this from a win to a loss</strong>. Before fees you were up{' '}
          {signedDollars(t.variant_net ?? 0)}; after {dollars(total)} in fees across {trades} trades,
          you finished at {signedDollars(t.primary_net ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">
          That's about {dollars(perTrade)} per round-trip.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Normal case: fees cost a known amount but didn't flip the result.
  return (
    <>
      <p>
        Commission <strong>COST</strong> you {dollars(total)} across {trades} trades — about{' '}
        {dollars(perTrade)} per round-trip.
      </p>
      <p className="text-xs text-muted-foreground">
        Before fees: {signedDollars(t.variant_net ?? 0)}. After fees: {signedDollars(t.primary_net ?? 0)}.
      </p>
      <p className="text-xs text-muted-foreground">{CAPTION}</p>
    </>
  );
}

// Renders the direction teaching dimension (fourth card): long_short vs long_only.
function DirectionCardBody({ t }: { t: TeachingEntry }) {
  const shorts = t.short_trade_count ?? 0;
  const isLongShort = t.primary_direction === 'long_short';

  // Not enough shorts to judge (or none taken).
  if (t.sufficient_data === false || shorts === 0) {
    return (
      <>
        <p>{isLongShort
          ? "This run didn't take enough short trades to tell what trading both sides did."
          : "You traded long-only, and there weren't enough short setups to compare against here."}</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // The direction choice flipped a win into a loss (or vice versa).
  if (t.flips_profitability === true) {
    const longOnlyNet = isLongShort ? (t.variant_net ?? 0) : (t.primary_net ?? 0);
    const withShortsNet = isLongShort ? (t.primary_net ?? 0) : (t.variant_net ?? 0);
    return (
      <>
        <p>
          {isLongShort ? 'Trading both sides' : 'Adding shorts'}{' '}
          <strong>flipped this between a win and a loss</strong>. Long-only:{' '}
          {signedDollars(longOnlyNet)}. With shorts: {signedDollars(withShortsNet)}.
        </p>
        <p className="text-xs text-muted-foreground">
          {shorts} short trades, netting {signedDollars(t.short_net ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Long & Short run: attribute the shorts' contribution directly.
  if (isLongShort) {
    const helped = t.direction === 'saved';   // delta_net > 0 => shorts made money
    return (
      <>
        <p>
          Your short trades <strong>{helped ? 'ADDED' : 'COST'}</strong> you{' '}
          {dollars(Math.abs(t.delta_net))} across {shorts} shorts.
        </p>
        <p className="text-xs text-muted-foreground">
          Long-only: {signedDollars(t.variant_net ?? 0)}. With shorts: {signedDollars(t.primary_net ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Long-only run: what-if of adding shorts. direction 'cost' => not trading them cost you =>
  // the shorts would have earned; 'saved' => they'd have lost, so staying long-only was better.
  const wouldEarn = t.direction === 'cost';
  return (
    <>
      <p>
        You traded long-only. Adding shorts <strong>would have {wouldEarn ? 'earned' : 'lost'}</strong>{' '}
        you {dollars(Math.abs(t.short_net ?? 0))} across {shorts} would-be shorts.
      </p>
      <p className="text-xs text-muted-foreground">
        Long-only: {signedDollars(t.primary_net ?? 0)}. With shorts: {signedDollars(t.variant_net ?? 0)}.
      </p>
      <p className="text-xs text-muted-foreground">{CAPTION}</p>
    </>
  );
}

// Renders the slippage teaching dimension (fifth card) — execution-cost mirror of commission.
function SlippageCardBody({ t }: { t: TeachingEntry }) {
  if (t.sufficient_data === false) {
    return (
      <>
        <p>Not enough trades to measure what slippage cost here.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  const total = t.total_slippage ?? 0;
  const trades = t.trade_count ?? 0;
  const ticks = t.slippage_ticks ?? 0;

  // No slippage set — nothing to compare, just a nudge.
  if (ticks <= 0 || total <= 0) {
    return (
      <>
        <p>This run had no slippage set, so there's nothing to compare.</p>
        <p className="text-xs text-muted-foreground">
          Real fills usually slip a tick or two. Add slippage to see the bite it takes out of your edge.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Headline case: slippage turned a winner into a loser.
  if (t.flips_profitability === true) {
    return (
      <>
        <p>
          Slippage <strong>flipped this from a win to a loss</strong>. Before slippage you were up{' '}
          {signedDollars(t.variant_net ?? 0)}; after {dollars(total)} at {ticks} tick{ticks === 1 ? '' : 's'}{' '}
          per fill across {trades} trades, you finished at {signedDollars(t.primary_net ?? 0)}.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Normal case: slippage cost a known amount but didn't flip the result.
  return (
    <>
      <p>
        Slippage <strong>COST</strong> you {dollars(total)} across {trades} trades — at {ticks}{' '}
        tick{ticks === 1 ? '' : 's'} per fill.
      </p>
      <p className="text-xs text-muted-foreground">
        Before slippage: {signedDollars(t.variant_net ?? 0)}. After slippage: {signedDollars(t.primary_net ?? 0)}.
      </p>
      <p className="text-xs text-muted-foreground">{CAPTION}</p>
    </>
  );
}

// Renders the position-size teaching dimension (sixth card) — amplification, not cost.
function PositionSizeCardBody({ t }: { t: TeachingEntry }) {
  const contracts = t.contracts ?? 0;
  const qtyType = t.qty_type ?? 'fixed';
  const sizeMultiple = t.size_multiple ?? 0;

  // Neutral: 1-contract fixed run — nothing to compare.
  if (t.direction === 'neutral' && qtyType === 'fixed' && contracts === 1) {
    return (
      <>
        <p>You traded 1 contract — nothing to compare.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Neutral: non-fixed sizing method not yet supported.
  if (t.direction === 'neutral') {
    return (
      <>
        <p>Position-size comparison isn't available for this sizing method yet.</p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  // Main case: size ≠ 1 contract — surface amplification of P&L and drawdown.
  if (t.direction === 'saved' || t.direction === 'cost') {
    return (
      <>
        <p>
          Trading {contracts} contracts turned a 1-contract result of{' '}
          {signedDollars(t.variant_net ?? 0)} into {signedDollars(t.primary_net ?? 0)} — that's{' '}
          <strong>
            {sizeMultiple}× the P&amp;L and about {sizeMultiple}× the max drawdown
          </strong>{' '}
          ({signedDollars(t.variant_max_dd ?? 0)} → {signedDollars(t.primary_max_dd ?? 0)}).
        </p>
        <p className="text-xs text-muted-foreground">
          Size multiplies your outcome and your risk, not your edge.
        </p>
        <p className="text-xs text-muted-foreground">{CAPTION}</p>
      </>
    );
  }

  return null;
}


function titleFor(dimension: string): string {
  if (dimension === 'position_size') return 'What your position size did';
  if (dimension === 'slippage') return 'What slippage cost you';
  if (dimension === 'direction') return 'What your direction choice did';
  if (dimension === 'commission') return 'What commission cost you';
  if (dimension === 'stop') return 'What your stop did';
  if (dimension === 'take_profit') return 'What your take-profit did';
  return `What your ${dimension.replace(/_/g, ' ')} did`;
}



const ALL_DIMENSIONS = [
  'stop',
  'take_profit',
  'commission',
  'direction',
  'slippage',
  'position_size',
] as const;

export default function BacktestTeachPanel({ run }: Props) {
  const { isAdmin } = useTier();

  if (!run) return null;

  const detail = (run.results_detail ?? {}) as Record<string, unknown>;
  const rawTeaching = detail._teaching ?? (detail as { teaching?: unknown }).teaching;
  const teachingArr: TeachingEntry[] | undefined = Array.isArray(rawTeaching)
    ? (rawTeaching as TeachingEntry[])
    : rawTeaching && typeof rawTeaching === 'object'
      ? [rawTeaching as TeachingEntry]
      : undefined;
  const sameSignal = detail._same_signal as boolean | undefined;

  // No teaching data at all.
  if (!teachingArr || teachingArr.length === 0) {
    if (!isAdmin) return null;
    return (
      <Shell title="Teaching cards">
        <p>No teaching data was returned for this run.</p>
        <p className="text-xs text-muted-foreground">
          The engine emits <code>_teaching</code> once a completed run has enough trades to
          compare against a counterfactual. Run a longer date range or a strategy that fires more
          often to see the six teach-compare cards here.
        </p>
      </Shell>
    );
  }

  // Broken comparison — show a single honest card (all users).
  if (sameSignal !== true) {
    return (
      <Shell title="Teaching cards">
        <p>We couldn't produce a reliable comparison for this run.</p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            <code>_same_signal</code> was not true — the counterfactual signal drifted from the
            primary run, so per-dimension deltas aren't attributable.
          </p>
        )}
      </Shell>
    );
  }

  // Non-admin: only render dimensions the engine actually returned.
  const dimensionsToRender: string[] = isAdmin
    ? [...ALL_DIMENSIONS, ...teachingArr.map((t) => t.dimension).filter((d) => !ALL_DIMENSIONS.includes(d as typeof ALL_DIMENSIONS[number]))]
    : teachingArr.map((t) => t.dimension);

  return (
    <div className="space-y-4">
      {dimensionsToRender.map((dim, idx) => {
        const t = teachingArr.find((x) => x.dimension === dim);
        const title = titleFor(dim);

        // Admin sees a placeholder for engine-expected dimensions that weren't returned.
        if (!t) {
          return (
            <Shell key={`${dim}-${idx}`} title={title}>
              <p className="text-muted-foreground">No data for this dimension in this run.</p>
              <p className="text-xs text-muted-foreground">
                The engine didn't emit a <code>{dim}</code> teaching entry — usually because that
                input wasn't configured (e.g. no slippage, 1-contract fixed size) or trade count
                was too low.
              </p>
            </Shell>
          );
        }

        const body =
          t.dimension === 'stop' ? (
            <StopCardBody t={t} />
          ) : t.dimension === 'take_profit' ? (
            <TakeProfitCardBody t={t} />
          ) : t.dimension === 'commission' ? (
            <CommissionCardBody t={t} />
          ) : t.dimension === 'direction' ? (
            <DirectionCardBody t={t} />
          ) : t.dimension === 'slippage' ? (
            <SlippageCardBody t={t} />
          ) : t.dimension === 'position_size' ? (
            <PositionSizeCardBody t={t} />
          ) : null;

        if (!body) return null;

        return (
          <Shell key={`${t.dimension}-${idx}`} title={title}>
            {body}
          </Shell>
        );
      })}
    </div>
  );
}

