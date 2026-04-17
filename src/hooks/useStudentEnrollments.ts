import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CohortEnrollment, Cohort, GuruProfile } from '@/types/guru';

export interface StudentEnrolledCohort {
  enrollment: CohortEnrollment;
  cohort: Cohort;
  guru: Pick<GuruProfile, 'id' | 'display_name' | 'avatar_url'>;
  contentCount: number;
}

export function useStudentEnrollments() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async (): Promise<StudentEnrolledCohort[]> => {
      if (!user) return [];
      const { data: enrollments, error: eErr } = await supabase
        .from('cohort_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'active');
      if (eErr) throw eErr;
      if (!enrollments || enrollments.length === 0) return [];

      const cohortIds = enrollments.map((e) => e.cohort_id);
      const { data: cohorts, error: cErr } = await supabase
        .from('cohorts')
        .select('*')
        .in('id', cohortIds);
      if (cErr) throw cErr;

      const guruIds = Array.from(new Set((cohorts ?? []).map((c) => c.guru_id)));
      const { data: gurus, error: gErr } = await supabase
        .from('guru_profiles')
        .select('id, display_name, avatar_url')
        .in('id', guruIds);
      if (gErr) throw gErr;

      const { data: contentRows, error: ctErr } = await supabase
        .from('guru_content')
        .select('cohort_id, is_draft')
        .in('cohort_id', cohortIds)
        .eq('is_draft', false);
      if (ctErr) throw ctErr;

      const counts = new Map<string, number>();
      (contentRows ?? []).forEach((r) => {
        counts.set(r.cohort_id, (counts.get(r.cohort_id) ?? 0) + 1);
      });

      return enrollments
        .map((enr) => {
          const cohort = (cohorts ?? []).find((c) => c.id === enr.cohort_id);
          if (!cohort) return null;
          const guru = (gurus ?? []).find((g) => g.id === cohort.guru_id);
          if (!guru) return null;
          return {
            enrollment: enr as CohortEnrollment,
            cohort: cohort as Cohort,
            guru,
            contentCount: counts.get(cohort.id) ?? 0,
          } as StudentEnrolledCohort;
        })
        .filter((x): x is StudentEnrolledCohort => x !== null);
    },
    enabled: !!user?.id,
  });

  return {
    enrollments: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useStudentCohort(cohortId: string | undefined) {
  const { enrollments, isLoading } = useStudentEnrollments();
  const match = enrollments.find((e) => e.cohort.id === cohortId) ?? null;
  return { enrolled: match, isLoading };
}
