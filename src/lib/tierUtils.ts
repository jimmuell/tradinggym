export const TIER_DISPLAY_NAMES: Record<string, string> = {
  foundation: 'Starter',
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
  coach: 'Guru',
};

export function getTierDisplayName(tierState: string): string {
  return TIER_DISPLAY_NAMES[tierState] ?? tierState;
}

export const TIER_ORDER = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];

export function getPlanDisplayName(planState: string): string {
  switch (planState) {
    case 'starter': return 'Starter (Free)';
    case 'pro':     return 'Pro ($29/mo)';
    case 'expert':  return 'Expert ($49/mo)';
    case 'guru':    return 'Guru ($99/mo)';
    default:        return 'Starter (Free)';
  }
}
