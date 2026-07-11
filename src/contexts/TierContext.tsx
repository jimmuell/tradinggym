import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TierState = 'foundation' | 'tier1' | 'tier2' | 'tier3' | 'coach';
export type PlanState = 'starter' | 'pro' | 'expert' | 'guru' | 'admin';

const TIER_ORDER: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];
const PLAN_VALUES: PlanState[] = ['starter', 'pro', 'expert', 'guru', 'admin'];

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
  role: string | null;
  isAdmin: boolean;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
  isUnlocked: (tier: TierState) => boolean;
  canAccess: (feature: string) => boolean;
  setTierState: (tier: TierState) => Promise<void>;
  refreshTier: () => Promise<void>;
  loading: boolean;
}

const TierContext = createContext<TierContextType>({
  currentTier: 'foundation',
  planState: 'starter',
  role: null,
  isAdmin: false,
  cancelAtPeriodEnd: false,
  subscriptionEndsAt: null,
  isUnlocked: () => false,
  canAccess: () => false,
  setTierState: async () => {},
  refreshTier: async () => {},
  loading: true,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTier = () => useContext(TierContext);

export function TierProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<TierState>('foundation');
  const [planState, setPlanStateLocal] = useState<PlanState>('starter');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('tier_state, plan_state, role' as any)
      .eq('user_id', user.id)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    const tier = (row?.tier_state as TierState) || 'foundation';
    const plan = (row?.plan_state as PlanState) || 'starter';
    const userRole = (row?.role as string) || null;
    setCurrentTier(TIER_ORDER.includes(tier) ? tier : 'foundation');
    setPlanStateLocal(PLAN_VALUES.includes(plan) ? plan : 'starter');
    setRole(userRole);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchTier();
  }, [user, fetchTier]);

  const isAdmin = role === 'admin' || planState === 'admin';

  const isUnlocked = useCallback(
    (tier: TierState) => isAdmin || TIER_ORDER.indexOf(currentTier) >= TIER_ORDER.indexOf(tier),
    [currentTier, isAdmin],
  );

  const canAccess = useCallback(
    (feature: string) => {
      if (isAdmin) return true;
      const required = FEATURE_TIER_MAP[feature];
      return required ? isUnlocked(required) : true;
    },
    [isUnlocked, isAdmin],
  );

  const setTierState = useCallback(
    async (tier: TierState) => {
      setCurrentTier(tier);
    },
    [],
  );

  return (
    <TierContext.Provider value={{ currentTier, planState, role, isAdmin, isUnlocked, canAccess, setTierState, refreshTier: fetchTier, loading }}>
      {children}
    </TierContext.Provider>
  );
}
