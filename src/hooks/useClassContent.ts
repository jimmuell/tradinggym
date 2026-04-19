import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GuruContent } from '@/types/guru';

export function useClassContent(classId: string | undefined) {
  const query = useQuery({
    queryKey: ['class-content', classId],
    queryFn: async (): Promise<GuruContent[]> => {
      if (!classId) return [];
      const { data, error } = await supabase
        .from('guru_content')
        .select('*')
        .eq('class_id', classId)
        .eq('is_draft', false)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as GuruContent[]).filter((c) => !c.is_draft);
    },
    enabled: !!classId,
  });

  return {
    content: query.data ?? [],
    isLoading: query.isLoading,
  };
}
