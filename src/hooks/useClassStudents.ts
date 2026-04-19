import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type {
  Class,
  ClassEnrollment,
  EnrolledStudent,
  StudentProfile,
  StudentStats,
  StudentTrade,
} from '@/types/guru';

interface UseClassStudentsResult {
  students: EnrolledStudent[];
  classes: Class[];
  isLoading: boolean;
}

/**
 * Fetches all students enrolled in any of the current guru's classes.
 * Optionally filterable by a specific classId in the consumer.
 */
export function useClassStudents(): UseClassStudentsResult {
  const { data: guruProfile } = useGuruProfile();
  const guruId = guruProfile?.id;

  const query = useQuery({
    queryKey: ['class-students', guruId],
    enabled: !!guruId,
    queryFn: async () => {
      if (!guruId) return { students: [] as EnrolledStudent[], classes: [] as Class[] };

      // 1. All classes owned by this guru
      const { data: classRows, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .eq('guru_id', guruId);
      if (classErr) throw classErr;
      const classes = (classRows ?? []) as Class[];
      const classIds = classes.map((c) => c.id);
      if (classIds.length === 0) {
        return { students: [], classes };
      }

      // 2. All enrollments for those classes
      const { data: enrollRows, error: enrollErr } = await supabase
        .from('class_enrollments')
        .select('*')
        .in('class_id', classIds);
      if (enrollErr) throw enrollErr;
      const enrollments = (enrollRows ?? []) as ClassEnrollment[];
      if (enrollments.length === 0) {
        return { students: [], classes };
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
      const classMap = new Map<string, Class>();
      classes.forEach((c) => classMap.set(c.id, c));

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
          const classItem = classMap.get(enrollment.class_id);
          if (!profile || !classItem) return null;
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
            meets_win_rate_gate: win_rate >= classItem.win_rate_gate,
          };
          return { enrollment, profile, class: classItem, stats };
        })
        .filter((x): x is EnrolledStudent => x !== null);

      return { students, classes };
    },
  });

  return {
    students: query.data?.students ?? [],
    classes: query.data?.classes ?? [],
    isLoading: query.isLoading,
  };
}
