import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type {
  Cohort,
  CohortEnrollment,
  EnrolledStudent,
  StudentProfile,
  StudentStats,
  StudentTrade,
} from '@/types/guru';

interface UseCohortStudentsResult {
  students: EnrolledStudent[];
  cohorts: Cohort[];
  isLoading: boolean;
}

/**
 * Fetches all students enrolled in any of the current guru's cohorts.
 * Optionally filterable by a specific cohortId in the consumer.
 */
export function useCohortStudents(): UseCohortStudentsResult {
  const { data: guruProfile } = useGuruProfile();
  const guruId = guruProfile?.id;

  const query = useQuery({
    queryKey: ['cohort-students', guruId],
    enabled: !!guruId,
    queryFn: async () => {
      if (!guruId) return { students: [] as EnrolledStudent[], cohorts: [] as Cohort[] };

      // 1. All cohorts owned by this guru
      const { data: cohortRows, error: cohortErr } = await supabase
        .from('cohorts')
        .select('*')
        .eq('guru_id', guruId);
      if (cohortErr) throw cohortErr;
      const cohorts = (cohortRows ?? []) as Cohort[];
      const cohortIds = cohorts.map((c) => c.id);
      if (cohortIds.length === 0) {
        return { students: [], cohorts };
      }

      // 2. All enrollments for those cohorts
      const { data: enrollRows, error: enrollErr } = await supabase
        .from('cohort_enrollments')
        .select('*')
        .in('cohort_id', cohortIds);
      if (enrollErr) throw enrollErr;
      const enrollments = (enrollRows ?? []) as CohortEnrollment[];
      if (enrollments.length === 0) {
        return { students: [], cohorts };
      }

      // 3. Profiles for those students (via security definer fn)
      const { data: profileRows, error: profileErr } = await supabase.rpc(
        'get_guru_student_profiles',
      );
      if (profileErr) throw profileErr;
      const profileMap = new Map<string, StudentProfile>();
      ((profileRows ?? []) as StudentProfile[]).forEach((p) => {
        profileMap.set(p.user_id, p);
      });
      const cohortMap = new Map<string, Cohort>();
      cohorts.forEach((c) => cohortMap.set(c.id, c));

      // 4. Trade aggregates per student via secure RPC
      const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));
      const statsByStudent = new Map<string, { wins: number; losses: number; total: number; pnl: number }>();
      await Promise.all(
        studentIds.map(async (sid) => {
          const { data: tradesData, error: tErr } = await supabase.rpc(
            'get_guru_student_trades',
            { _student_id: sid },
          );
          if (tErr) return;
          const trades = (tradesData ?? []) as StudentTrade[];
          let wins = 0;
          let losses = 0;
          let pnl = 0;
          trades.forEach((t) => {
            if (t.result === 'win') wins += 1;
            else if (t.result === 'loss') losses += 1;
            pnl += Number(t.pnl ?? 0);
          });
          statsByStudent.set(sid, { wins, losses, total: trades.length, pnl });
        }),
      );

      // 5. Compose result
      const students: EnrolledStudent[] = enrollments
        .map((enrollment) => {
          const profile = profileMap.get(enrollment.student_id);
          const cohort = cohortMap.get(enrollment.cohort_id);
          if (!profile || !cohort) return null;
          const agg = statsByStudent.get(enrollment.student_id) ?? {
            wins: 0,
            losses: 0,
            total: 0,
            pnl: 0,
          };
          const win_rate = agg.total > 0 ? (agg.wins / agg.total) * 100 : 0;
          const stats: StudentStats = {
            total_trades: agg.total,
            wins: agg.wins,
            losses: agg.losses,
            net_pnl: agg.pnl,
            win_rate,
            meets_win_rate_gate: win_rate >= cohort.win_rate_gate,
          };
          return { enrollment, profile, cohort, stats };
        })
        .filter((x): x is EnrolledStudent => x !== null);

      return { students, cohorts };
    },
  });

  return {
    students: query.data?.students ?? [],
    cohorts: query.data?.cohorts ?? [],
    isLoading: query.isLoading,
  };
}
