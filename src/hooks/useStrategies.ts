import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Strategy {
  id: string;
  name: string;
  is_system: boolean | null;
  tier_required: string | null;
}

export function useStrategies() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['strategies', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Strategy[]> => {
      const { data, error } = await supabase
        .from('strategies')
        .select('id, name, is_system, tier_required')
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Strategy[];
    },
  });

  return { strategies: data ?? [], isLoading };
}
