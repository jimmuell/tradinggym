import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TierState = 'foundation' | 'tier1' | 'tier2' | 'tier3' | 'coach';
export type PlanState = 'starter' | 'pro' | 'expert' | 'guru';

const TIER_ORDER: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];
const PLAN_VALUES: PlanState[] = ['starter', 'pro', 'expert', 'guru'];

const FEATURE_TIER_MAP: Record<string, TierState> = {
  simulator: 'tier1',
  strategies: 'tier1',
  backtesting: 'tier2',
  analytics: 'tier1',
  transcript_upload: 'tier2',
};

interface TierContextType {
  currentTier: TierState;
  planState: PlanState;
  isUnlocked: (tier: TierState) => boolean;
  canAccess: (feature: string) => boolean;
  setTierState: (tier: TierState) => Promise<void>;
  setPlanState: (plan: PlanState) => Promise<void>;
  loading: boolean;
}

const TierContext = createContext<TierContextType>({
  currentTier: 'foundation',
  planState: 'starter',
  isUnlocked: () => false,
  canAccess: () => false,
  setTierState: async () => {},
  setPlanState: async () => {},
  loading: true,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTier = () => useContext(TierContext);

export function TierProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<TierState>('foundation');
  const [planState, setPlanStateLocal] = useState<PlanState>('starter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('tier_state, plan_state' as any)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = data as any;
        const tier = (row?.tier_state as TierState) || 'foundation';
        const plan = (row?.plan_state as PlanState) || 'starter';
        setCurrentTier(TIER_ORDER.includes(tier) ? tier : 'foundation');
        setPlanStateLocal(PLAN_VALUES.includes(plan) ? plan : 'starter');
        setLoading(false);
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
    [],
  );

  const setPlanState = useCallback(
    async (plan: PlanState) => {
      setPlanStateLocal(plan);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('update_own_plan_state', { new_plan_state: plan });
    },
    [],
  );

  return (
    <TierContext.Provider value={{ currentTier, planState, isUnlocked, canAccess, setTierState, setPlanState, loading }}>
      {children}
    </TierContext.Provider>
  );
}
