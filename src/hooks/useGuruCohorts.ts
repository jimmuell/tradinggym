import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type { Cohort, CohortFormData } from '@/types/guru';

export function useGuruCohorts() {
  const { data: guruProfile } = useGuruProfile();
  const qc = useQueryClient();
  const guruId = guruProfile?.id;

  const query = useQuery({
    queryKey: ['cohorts', guruId],
    queryFn: async (): Promise<Cohort[]> => {
      if (!guruId) return [];
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .eq('guru_id', guruId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cohort[];
    },
    enabled: !!guruId,
  });

  const createCohort = useMutation({
    mutationFn: async (data: CohortFormData): Promise<Cohort> => {
      if (!guruId) throw new Error('No guru profile');
      const { data: row, error } = await supabase
        .from('cohorts')
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
      return row as Cohort;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cohorts', guruId] });
    },
  });

  const updateCohort = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CohortFormData>;
    }): Promise<Cohort> => {
      const payload = {
        ...data,
        ...('description' in data
          ? { description: data.description ? data.description : null }
          : {}),
      };
      const { data: row, error } = await supabase
        .from('cohorts')
        .update(payload as never)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return row as Cohort;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cohorts', guruId] });
    },
  });

  const deleteCohort = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('cohorts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cohorts', guruId] });
    },
  });

  return {
    cohorts: query.data ?? [],
    isLoading: query.isLoading,
    createCohort,
    updateCohort,
    deleteCohort,
  };
}
