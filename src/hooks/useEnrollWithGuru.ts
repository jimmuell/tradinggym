import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnrollInput {
  guruId: string;
  referralCode?: string;
}

interface EnrollResult {
  success: boolean;
  enrollment_id: string;
  cohort_id: string;
  plan: 'pro' | 'expert';
  enrollment_type: 'organic' | 'referred';
}

export function useEnrollWithGuru() {
  return useMutation<EnrollResult, Error, EnrollInput>({
    mutationFn: async ({ guruId, referralCode }) => {
      const { data, error } = await supabase.functions.invoke('enroll-with-guru', {
        body: { guru_id: guruId, referral_code: referralCode },
      });
      if (error) {
        // Try to extract message from response body
        const ctx = error.context as { body?: string } | undefined;
        let parsed: { message?: string; error?: string } | null = null;
        try {
          if (ctx?.body) parsed = JSON.parse(ctx.body);
        } catch { /* ignore */ }
        throw new Error(parsed?.message || error.message || 'Enrollment failed');
      }
      return data as EnrollResult;
    },
  });
}
