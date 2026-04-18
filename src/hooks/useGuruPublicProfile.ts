import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PublicProfileFields {
  tagline: string | null;
  bio: string | null;
  primary_instrument: string | null;
  primary_strategy: string | null;
}

export function useUpdateGuruPublicProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (fields: PublicProfileFields) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('guru_profiles')
        .update({
          tagline: fields.tagline,
          bio: fields.bio,
          primary_instrument: fields.primary_instrument,
          primary_strategy: fields.primary_strategy,
        })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru_profile', user?.id] });
      qc.invalidateQueries({ queryKey: ['public-gurus'] });
    },
  });
}

export function useToggleGuruIsPublic() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('guru_profiles')
        .update({ is_public: isPublic })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guru_profile', user?.id] });
      qc.invalidateQueries({ queryKey: ['public-gurus'] });
    },
  });
}
