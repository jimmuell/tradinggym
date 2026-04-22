import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_role');
      if (error) throw error;
      return (data as string) ?? 'user';
    },
  });

  const role = data ?? null;
  return {
    role,
    isAdmin: role === 'admin',
    isInvestor: role === 'investor',
    isLoading,
  };
}
