import { useMutation } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CheckoutResponse = {
  url?: string;
  error?: string;
  portal_url?: string;
};

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const { data, error } = await supabase.functions.invoke<CheckoutResponse>('create-checkout-session', {
        body: { priceId },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const payload = await error.context.json().catch(() => null) as CheckoutResponse | null;
          if (payload?.error === 'already_subscribed') return payload;
          throw new Error(error.message);
        }
        throw error;
      }
      return (data ?? {}) as CheckoutResponse;
    },
    onSuccess: (data) => {
      if (data.error === 'already_subscribed' && data.portal_url) {
        toast.info('You already have an active subscription. Manage or change your plan in the billing portal.');
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.href = data.portal_url;
            return;
          }
        } catch {
          window.open(data.portal_url, '_blank', 'noopener,noreferrer');
          return;
        }
        window.location.href = data.portal_url;
        return;
      }
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast.error('Failed to start checkout — please try again.');
    },
  });
}
