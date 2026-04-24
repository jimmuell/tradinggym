import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StrategyShape {
  id: string;
  name: string;
  direction_bias: string | null;
  entry_rules: string | null;
  notes: string | null;
  description: string | null;
}

const INDICATOR_KEYWORDS: { tag: string; rx: RegExp }[] = [
  { tag: 'ema9', rx: /\bema[\s-]*9\b|\bema9\b/i },
  { tag: 'ema20', rx: /\bema[\s-]*20\b|\bema20\b/i },
  { tag: 'vwap', rx: /\bvwap\b/i },
  { tag: 'orb', rx: /\borb\b|opening\s+range/i },
  { tag: 'rsi', rx: /\brsi\b/i },
  { tag: 'macd', rx: /\bmacd\b/i },
  { tag: 'sma', rx: /\bsma\b|simple\s+moving\s+average/i },
];

export function extractIndicatorTags(strategy: StrategyShape): string[] {
  const text = [strategy.name, strategy.entry_rules, strategy.notes, strategy.description]
    .filter(Boolean)
    .join(' ');
  const tags = new Set<string>();
  for (const { tag, rx } of INDICATOR_KEYWORDS) {
    if (rx.test(text)) tags.add(tag);
  }
  return Array.from(tags);
}

export function useScenarioMatch(strategy: StrategyShape | null | undefined) {
  return useQuery({
    queryKey: ['scenario_match', strategy?.id],
    enabled: !!strategy,
    queryFn: async (): Promise<string | null> => {
      if (!strategy) return null;
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_playback_scenarios' as any)
        .select('id, indicator_tags, direction')
        .eq('is_active', true);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scenarios = (data ?? []) as any[];
      if (!scenarios.length) return null;

      const stratTags = extractIndicatorTags(strategy);
      const stratDir = (strategy.direction_bias || '').toLowerCase();

      // Score: tag overlap + direction match bonus
      let best: { id: string; score: number } | null = null;
      for (const sc of scenarios) {
        const tags: string[] = sc.indicator_tags ?? [];
        const overlap = tags.filter((t) => stratTags.includes(t)).length;
        const dirBonus =
          stratDir.includes(sc.direction) || sc.direction === 'long' || stratDir === '' ? 1 : 0;
        const score = overlap * 10 + dirBonus;
        if (!best || score > best.score) best = { id: sc.id, score };
      }
      return best?.id ?? scenarios[0].id;
    },
  });
}
