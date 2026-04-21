import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: returnUrl ? { returnUrl } : {},
      });
      if (error) throw error;
      if (data?.error === 'no_subscription') {
        throw new Error(data.message);
      }
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to open billing portal — please try again.');
    },
  });
}
