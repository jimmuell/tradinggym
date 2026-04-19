import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type { GuruContent, ContentFormData } from '@/types/guru';

export function useGuruContent() {
  const { data: guruProfile } = useGuruProfile();
  const qc = useQueryClient();
  const guruId = guruProfile?.id;
  const queryKey = ['guru-content', guruId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<GuruContent[]> => {
      if (!guruId) return [];
      const { data, error } = await supabase
        .from('guru_content')
        .select('*')
        .eq('guru_id', guruId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GuruContent[];
    },
    enabled: !!guruId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createContent = useMutation({
    mutationFn: async (data: ContentFormData): Promise<GuruContent> => {
      if (!guruId) throw new Error('No guru profile');
      const { data: row, error } = await supabase
        .from('guru_content')
        .insert({
          guru_id: guruId,
          class_id: data.class_id,
          title: data.title,
          body: data.body,
          content_type: data.content_type,
          is_draft: data.is_draft,
          published_at: data.is_draft ? null : new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;
      return row as GuruContent;
    },
    onSuccess: invalidate,
  });

  const updateContent = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ContentFormData>;
    }): Promise<GuruContent> => {
      const { data: row, error } = await supabase
        .from('guru_content')
        .update(data as never)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return row as GuruContent;
    },
    onSuccess: invalidate,
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('guru_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const publishContent = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('guru_content')
        .update({ is_draft: false, published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unpublishContent = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('guru_content')
        .update({ is_draft: true, published_at: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    content: query.data ?? [],
    isLoading: query.isLoading,
    createContent,
    updateContent,
    deleteContent,
    publishContent,
    unpublishContent,
  };
}
