import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnrollInput {
  guruId: string;
  referralCode?: string;
}

interface EnrollResult {
  success: boolean;
  enrollment_id: string;
  class_id: string;
  plan: 'pro' | 'expert';
  enrollment_type: 'organic' | 'referred' | 'expert_trial';
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
      // Edge function (until Prompt 3) returns { cohort_id }; normalize to class_id
      const raw = data as Record<string, unknown>;
      return {
        success: raw.success as boolean,
        enrollment_id: raw.enrollment_id as string,
        class_id: (raw.class_id ?? raw.cohort_id) as string,
        plan: raw.plan as 'pro' | 'expert',
        enrollment_type: raw.enrollment_type as 'organic' | 'referred' | 'expert_trial',
      };
    },
  });
}
