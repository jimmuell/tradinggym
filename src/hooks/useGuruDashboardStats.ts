import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGuruDashboardStats(guruProfileId: string | undefined) {
  const query = useQuery({
    queryKey: ['guru-dashboard-stats', guruProfileId],
    enabled: !!guruProfileId,
    queryFn: async () => {
      if (!guruProfileId) return { activeStudents: 0, activeCohorts: 0 };

      const { data: cohortRows, error: cErr } = await supabase
        .from('cohorts')
        .select('id, status')
        .eq('guru_id', guruProfileId);
      if (cErr) throw cErr;
      const cohorts = cohortRows ?? [];
      const activeCohorts = cohorts.filter((c) => c.status === 'active').length;
      const cohortIds = cohorts.map((c) => c.id);

      let activeStudents = 0;
      if (cohortIds.length > 0) {
        const { count, error: eErr } = await supabase
          .from('cohort_enrollments')
          .select('*', { count: 'exact', head: true })
          .in('cohort_id', cohortIds)
          .eq('status', 'active');
        if (eErr) throw eErr;
        activeStudents = count ?? 0;
      }

      return { activeStudents, activeCohorts };
    },
  });

  return {
    activeStudents: query.data?.activeStudents ?? 0,
    activeCohorts: query.data?.activeCohorts ?? 0,
    isLoading: query.isLoading,
  };
}
