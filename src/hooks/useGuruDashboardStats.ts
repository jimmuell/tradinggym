import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGuruDashboardStats(guruProfileId: string | undefined) {
  const query = useQuery({
    queryKey: ['guru-dashboard-stats', guruProfileId],
    enabled: !!guruProfileId,
    queryFn: async () => {
      if (!guruProfileId) return { activeStudents: 0, activeClasses: 0 };

      const { data: classRows, error: cErr } = await supabase
        .from('classes')
        .select('id, status')
        .eq('guru_id', guruProfileId);
      if (cErr) throw cErr;
      const classes = classRows ?? [];
      const activeClasses = classes.filter((c) => c.status === 'active').length;
      const classIds = classes.map((c) => c.id);

      let activeStudents = 0;
      if (classIds.length > 0) {
        const { count, error: eErr } = await supabase
          .from('class_enrollments')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds)
          .eq('status', 'active');
        if (eErr) throw eErr;
        activeStudents = count ?? 0;
      }

      return { activeStudents, activeClasses };
    },
  });

  return {
    activeStudents: query.data?.activeStudents ?? 0,
    activeClasses: query.data?.activeClasses ?? 0,
    isLoading: query.isLoading,
  };
}
