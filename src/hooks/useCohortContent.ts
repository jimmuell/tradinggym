import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GuruContent } from '@/types/guru';

export function useCohortContent(cohortId: string | undefined) {
  const query = useQuery({
    queryKey: ['cohort-content', cohortId],
    queryFn: async (): Promise<GuruContent[]> => {
      if (!cohortId) return [];
      const { data, error } = await supabase
        .from('guru_content')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('is_draft', false)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as GuruContent[]).filter((c) => !c.is_draft);
    },
    enabled: !!cohortId,
  });

  return {
    content: query.data ?? [],
    isLoading: query.isLoading,
  };
}
