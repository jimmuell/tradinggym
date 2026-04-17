import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { GuruProfile, GuruApplication, ApplicationFormData } from '@/types/guru';

export function useGuruProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guru_profile', user?.id],
    queryFn: async (): Promise<GuruProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('guru_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as GuruProfile | null) ?? null;
    },
    enabled: !!user?.id,
  });
}

export function useGuruApplication() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['guru_application', user?.id],
    queryFn: async (): Promise<GuruApplication | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('guru_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as GuruApplication | null) ?? null;
    },
    enabled: !!user?.id,
  });

  const submitApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('guru_applications').insert({
        user_id: user.id,
        full_name: data.full_name,
        email: data.email,
        trading_style: data.trading_style,
        years_experience: data.years_experience,
        what_you_teach: data.what_you_teach,
        existing_presence: data.existing_presence ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru_application', user?.id] });
    },
  });

  return { ...query, submitApplication };
}
