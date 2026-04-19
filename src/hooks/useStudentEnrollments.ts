import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ClassEnrollment, Class, GuruProfile } from '@/types/guru';

export interface StudentEnrolledClass {
  enrollment: ClassEnrollment;
  class: Class;
  guru: Pick<GuruProfile, 'id' | 'display_name' | 'avatar_url'>;
  contentCount: number;
}

export function useStudentEnrollments() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async (): Promise<StudentEnrolledClass[]> => {
      if (!user) return [];
      const { data: enrollments, error: eErr } = await supabase
        .from('class_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'active');
      console.log('[useStudentEnrollments] enrollments:', { rows: enrollments, error: eErr });
      if (eErr) throw eErr;
      if (!enrollments || enrollments.length === 0) return [];

      const classIds = enrollments.map((e) => e.class_id);
      const { data: classes, error: cErr } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);
      console.log('[useStudentEnrollments] classes:', { classIds, rows: classes, error: cErr });
      if (cErr) throw cErr;

      const guruIds = Array.from(new Set((classes ?? []).map((c) => c.guru_id)));
      const { data: gurus, error: gErr } = await supabase
        .from('guru_profiles')
        .select('id, display_name, avatar_url')
        .in('id', guruIds);
      if (gErr) throw gErr;

      const { data: contentRows, error: ctErr } = await supabase
        .from('guru_content')
        .select('class_id, is_draft')
        .in('class_id', classIds)
        .eq('is_draft', false);
      if (ctErr) throw ctErr;

      const counts = new Map<string, number>();
      (contentRows ?? []).forEach((r) => {
        counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
      });

      const result = enrollments
        .map((enr) => {
          const classItem = (classes ?? []).find((c) => c.id === enr.class_id);
          const guru = classItem ? (gurus ?? []).find((g) => g.id === classItem.guru_id) : undefined;
          console.log('[useStudentEnrollments] map step:', {
            enrollmentId: enr.id,
            classId: enr.class_id,
            classFound: !!classItem,
            guruId: classItem?.guru_id,
            guruFound: !!guru,
          });
          if (!classItem) return null;
          if (!guru) return null;
          return {
            enrollment: enr as ClassEnrollment,
            class: classItem as Class,
            guru,
            contentCount: counts.get(classItem.id) ?? 0,
          } as StudentEnrolledClass;
        })
        .filter((x): x is StudentEnrolledClass => x !== null);
      console.log('[useStudentEnrollments] mapped result:', result);
      return result;
    },
    enabled: !!user?.id,
  });

  return {
    enrollments: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useStudentClass(classId: string | undefined) {
  const { enrollments, isLoading } = useStudentEnrollments();
  const match = enrollments.find((e) => e.class.id === classId) ?? null;
  console.log('[useStudentClass] lookup:', {
    requestedClassId: classId,
    enrollmentCount: enrollments.length,
    enrollmentClassIds: enrollments.map((e) => e.class.id),
    matched: !!match,
    isLoading,
  });
  return { enrolled: match, isLoading };
}
