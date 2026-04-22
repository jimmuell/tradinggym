import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTier, type TierState } from '@/contexts/TierContext';
import { getTierDisplayName } from '@/lib/tierUtils';

interface PromoteResult {
  success: boolean;
  new_tier?: TierState;
  error?: string;
  current?: number;
}

export function usePromoteTier() {
  const { refreshTier } = useTier();

  return useMutation({
    mutationFn: async (targetTier: TierState): Promise<PromoteResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('promote_tier', { target_tier: targetTier });
      if (error) throw error;
      return data as PromoteResult;
    },
    onSuccess: async (result) => {
      if (result.success && result.new_tier) {
        await refreshTier();
        toast.success(`Congratulations! You've unlocked ${getTierDisplayName(result.new_tier)}!`);
      } else {
        const msg = result.current !== undefined
          ? `${result.error} (current: ${result.current})`
          : result.error || 'Promotion failed';
        toast.info(msg);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Promotion failed');
    },
  });
}
