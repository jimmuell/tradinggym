import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });
      if (error) throw error;
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Failed to start checkout — please try again.');
    },
  });
}
