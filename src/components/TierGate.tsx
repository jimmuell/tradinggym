/**
 * TierGate — shared guard for plan-/tier-gated UI.
 *
 * THE RULE this enforces:
 *   Never render a plan-gated view while you are still finding out
 *   what the plan IS. While TierContext.loading is true → skeleton (or nothing).
 *   NEVER the wrong answer.
 *
 * Two entry points:
 *   1) <TierGate fallback={<Skeleton />}>...</TierGate>  — wrap gated JSX.
 *   2) useTierReady() → { ready, ...useTier() }         — for pages that
 *      early-return based on tier (e.g. isUnlocked() locked-state screens).
 *      Callers MUST bail on `!ready` before reading planState / isUnlocked.
 *
 * Add a new gated view? Use one of these. Do not read planState/currentTier/
 * isUnlocked directly without first checking `loading` — that is the exact
 * bug class that caused the OAuth landing flash and the Foundation read-path
 * ghost-graduate incident.
 */
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';

interface TierGateProps {
  children: ReactNode;
  /** Rendered while tier is resolving. Default: a small centered spinner. */
  fallback?: ReactNode;
}

export function TierGate({ children, fallback }: TierGateProps) {
  const { loading } = useTier();
  if (loading) {
    return (
      fallback ?? (
        <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )
    );
  }
  return <>{children}</>;
}

/**
 * useTierReady — same as useTier() but with a `ready` flag callers must gate on
 * before reading plan/tier values. Use in pages that early-return based on tier.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTierReady() {
  const tier = useTier();
  return { ...tier, ready: !tier.loading };
}
