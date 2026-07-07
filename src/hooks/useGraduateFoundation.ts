import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTier } from '@/contexts/TierContext';

interface GraduateResult {
  success: boolean;
  new_tier?: string;
  error?: string;
  missing_lessons?: number;
  total_lessons?: number;
}

export function useGraduateFoundation() {
  const { refreshTier } = useTier();
  return useMutation({
    mutationFn: async (): Promise<GraduateResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('graduate_foundation');
      if (error) throw error;
      return data as GraduateResult;
    },
    onSuccess: async (result) => {
      if (result.success) {
        await refreshTier();
      } else {
        const msg = result.missing_lessons
          ? `${result.error} (${result.missing_lessons} of ${result.total_lessons} still to complete)`
          : result.error || 'Graduation failed';
        toast.info(msg);
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Graduation failed'),
  });
}
