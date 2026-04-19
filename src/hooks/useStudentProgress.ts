import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGuruProfile } from '@/hooks/useGuruData';
import type {
  Class,
  ClassEnrollment,
  StudentProfile,
  StudentStats,
  StudentTrade,
} from '@/types/guru';

interface UseStudentProgressResult {
  profile: StudentProfile | null;
  enrollment: (ClassEnrollment & { class: Class }) | null;
  trades: StudentTrade[];
  stats: StudentStats | null;
  streak: number;
  isLoading: boolean;
  notFound: boolean;
}

export function useStudentProgress(studentId: string | undefined): UseStudentProgressResult {
  const { data: guruProfile } = useGuruProfile();
  const guruId = guruProfile?.id;

  const query = useQuery({
    queryKey: ['student-progress', guruId, studentId],
    enabled: !!guruId && !!studentId,
    queryFn: async () => {
      if (!guruId || !studentId) return null;

      // Verify enrollment in this guru's classes
      const { data: classRows, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .eq('guru_id', guruId);
      if (classErr) throw classErr;
      const classes = (classRows ?? []) as Class[];
      if (classes.length === 0) return null;

      const { data: enrollRows, error: enrollErr } = await supabase
        .from('class_enrollments')
        .select('*')
        .eq('student_id', studentId)
        .in(
          'class_id',
          classes.map((c) => c.id),
        );
      if (enrollErr) throw enrollErr;
      const enrollments = (enrollRows ?? []) as unknown as ClassEnrollment[];
      if (enrollments.length === 0) return null;
      const enrollment = enrollments[0];
      const classItem = classes.find((c) => c.id === enrollment.class_id)!;

      // Profile via RPC
      const { data: profileRows, error: pErr } = await supabase.rpc('get_guru_student_profiles');
      if (pErr) throw pErr;
      const profile =
        ((profileRows ?? []) as StudentProfile[]).find((p) => p.user_id === studentId) ?? null;

      // Trades via RPC
      const { data: tradesData, error: tErr } = await supabase.rpc('get_guru_student_trades', {
        _student_id: studentId,
      });
      if (tErr) throw tErr;
      const allTrades = (tradesData ?? []) as StudentTrade[];
      const trades = [...allTrades].sort((a, b) => {
        const ad = new Date(a.created_at ?? a.opened_at ?? 0).getTime();
        const bd = new Date(b.created_at ?? b.opened_at ?? 0).getTime();
        return bd - ad;
      });

      let wins = 0;
      let losses = 0;
      let pnl = 0;
      trades.forEach((t) => {
        if (t.result === 'win') wins += 1;
        else if (t.result === 'loss') losses += 1;
        pnl += Number(t.pnl ?? 0);
      });
      const total = trades.length;
      const win_rate = total > 0 ? (wins / total) * 100 : 0;
      const stats: StudentStats = {
        total_trades: total,
        wins,
        losses,
        net_pnl: pnl,
        win_rate,
        meets_win_rate_gate: win_rate >= classItem.win_rate_gate,
      };

      // Streak: consecutive same-result count from most recent
      let streak = 0;
      if (trades.length > 0) {
        const first = trades[0].result;
        if (first === 'win' || first === 'loss') {
          for (const t of trades) {
            if (t.result === first) streak += 1;
            else break;
          }
          if (first === 'loss') streak = -streak;
        }
      }

      return {
        profile,
        enrollment: { ...enrollment, class: classItem },
        trades,
        stats,
        streak,
      };
    },
  });

  return {
    profile: query.data?.profile ?? null,
    enrollment: query.data?.enrollment ?? null,
    trades: query.data?.trades ?? [],
    stats: query.data?.stats ?? null,
    streak: query.data?.streak ?? 0,
    isLoading: query.isLoading,
    notFound: !query.isLoading && query.data === null,
  };
}
