import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TierState = 'foundation' | 'tier1' | 'tier2' | 'tier3' | 'coach';

const TIER_ORDER: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];

const FEATURE_TIER_MAP: Record<string, TierState> = {
  simulator: 'tier1',
  strategies: 'tier1',
  backtesting: 'tier2',
  analytics: 'tier1',
  coaching: 'coach',
  transcript_upload: 'tier2',
};

interface TierContextType {
  currentTier: TierState;
  isUnlocked: (tier: TierState) => boolean;
  canAccess: (feature: string) => boolean;
  setTierState: (tier: TierState) => Promise<void>;
  loading: boolean;
}

const TierContext = createContext<TierContextType>({
  currentTier: 'foundation',
  isUnlocked: () => false,
  canAccess: () => false,
  setTierState: async () => {},
  loading: true,
});

export const useTier = () => useContext(TierContext);

export function TierProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<TierState>('foundation');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from('profiles')
      .select('tier_state')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          const tier = (data?.tier_state as TierState) || 'foundation';
          setCurrentTier(TIER_ORDER.includes(tier) ? tier : 'foundation');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user]);

  const isUnlocked = useCallback(
    (tier: TierState) => TIER_ORDER.indexOf(currentTier) >= TIER_ORDER.indexOf(tier),
    [currentTier],
  );

  const canAccess = useCallback(
    (feature: string) => {
      const required = FEATURE_TIER_MAP[feature];
      return required ? isUnlocked(required) : true;
    },
    [isUnlocked],
  );

  const setTierState = useCallback(
    async (tier: TierState) => {
      setCurrentTier(tier);
    },
    [user],
  );

  return (
    <TierContext.Provider value={{ currentTier, isUnlocked, canAccess, setTierState, loading }}>
      {children}
    </TierContext.Provider>
  );
}
