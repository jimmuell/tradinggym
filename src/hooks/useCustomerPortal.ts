import { useMutation } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PortalResponse = {
  url?: string;
  error?: string;
  message?: string;
};

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const { data, error } = await supabase.functions.invoke<PortalResponse>('create-portal-session', {
        body: returnUrl ? { returnUrl } : {},
      });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const payload = await error.context.json().catch(() => null) as PortalResponse | null;
          if (payload?.error === 'no_subscription') return payload;
          throw new Error(payload?.message || error.message);
        }
        throw error;
      }

      return data ?? {};
    },
    onSuccess: (data) => {
      if (data.error === 'no_subscription') {
        toast.error(data.message || 'No active subscription found. Please choose a plan first.');
        return;
      }

      if (!data.url) {
        toast.error('Unable to open billing portal — please try again.');
        return;
      }

      window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to open billing portal — please try again.');
    },
  });
}
