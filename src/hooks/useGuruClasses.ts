import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type { Class, ClassFormData } from '@/types/guru';

export function useGuruClasses() {
  const { data: guruProfile } = useGuruProfile();
  const qc = useQueryClient();
  const guruId = guruProfile?.id;

  const query = useQuery({
    queryKey: ['classes', guruId],
    queryFn: async (): Promise<Class[]> => {
      if (!guruId) return [];
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('guru_id', guruId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Class[];
    },
    enabled: !!guruId,
  });

  const createClass = useMutation({
    mutationFn: async (data: ClassFormData): Promise<Class> => {
      if (!guruId) throw new Error('No guru profile');
      const { data: row, error } = await supabase
        .from('classes')
        .insert({
          guru_id: guruId,
          name: data.name,
          description: data.description || null,
          price_monthly: data.price_monthly,
          win_rate_gate: data.win_rate_gate,
          max_students: data.max_students,
          status: data.status,
        })
        .select('*')
        .single();
      if (error) throw error;
      return row as Class;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', guruId] });
    },
  });

  const updateClass = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ClassFormData>;
    }): Promise<Class> => {
      const payload = {
        ...data,
        ...('description' in data
          ? { description: data.description ? data.description : null }
          : {}),
      };
      const { data: row, error } = await supabase
        .from('classes')
        .update(payload as never)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return row as Class;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', guruId] });
    },
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes', guruId] });
    },
  });

  return {
    classes: query.data ?? [],
    isLoading: query.isLoading,
    createClass,
    updateClass,
    deleteClass,
  };
}
