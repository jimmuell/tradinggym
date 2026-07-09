export const TIER_DISPLAY_NAMES: Record<string, string> = {
  foundation: 'Foundation',
  tier1: 'Price Action',
  tier2: 'Confirmation',
  tier3: 'Institutional',
  coach: 'Guru',
};

export function getTierDisplayName(tierState: string): string {
  return TIER_DISPLAY_NAMES[tierState] ?? tierState;
}

export const TIER_ORDER = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];

export const PAID_PLANS = ['pro', 'expert', 'guru', 'admin'] as const;
export type PaidPlan = typeof PAID_PLANS[number];

/**
 * Returns true for the Free plan. Stored plan_state for Free is 'starter'
 * (not 'free') — plus any unknown value is treated as Free.
 */
export function isFreePlan(planState: string | null | undefined): boolean {
  return !PAID_PLANS.includes(planState as PaidPlan);
}

export function getPlanName(planState: string): string {
  switch (planState) {
    case 'starter': return 'Free';
    case 'pro':     return 'Pro';
    case 'expert':  return 'Expert';
    case 'guru':    return 'Guru';
    default:        return 'Free';
  }
}

export function getPlanDisplayName(planState: string): string {
  switch (planState) {
    case 'starter': return 'Free';
    case 'pro':     return 'Pro ($29/mo)';
    case 'expert':  return 'Expert ($49/mo)';
    case 'guru':    return 'Guru ($99/mo)';
    default:        return 'Free';
  }
}
