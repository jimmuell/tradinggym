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
