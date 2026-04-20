import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConnectStatus {
  status: 'not_started' | 'pending' | 'active' | 'restricted';
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

export function useStripeConnect() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const statusQuery = useQuery<ConnectStatus>({
    queryKey: ['stripe-connect-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-connect-status');
      if (error) throw error;
      return data as ConnectStatus;
    },
    enabled: !!user?.id,
  });

  const startOnboarding = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      if (error) throw error;
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const refreshStatus = () => {
    qc.invalidateQueries({ queryKey: ['stripe-connect-status', user?.id] });
    qc.invalidateQueries({ queryKey: ['guru_profile', user?.id] });
  };

  return {
    status: statusQuery.data?.status ?? 'not_started',
    chargesEnabled: statusQuery.data?.charges_enabled ?? false,
    payoutsEnabled: statusQuery.data?.payouts_enabled ?? false,
    isLoading: statusQuery.isLoading,
    startOnboarding,
    refreshStatus,
  };
}
