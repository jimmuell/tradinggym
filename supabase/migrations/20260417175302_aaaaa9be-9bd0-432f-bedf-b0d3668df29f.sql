-- Replace view with a security definer function approach
DROP VIEW IF EXISTS public.guru_student_profiles;

-- Helper: is the current user a guru that has this student enrolled?
CREATE OR REPLACE FUNCTION public.guru_has_student(_student_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cohort_enrollments ce
    JOIN cohorts c ON ce.cohort_id = c.id
    JOIN guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
      AND ce.student_id = _student_id
  );
$$;

-- Returns profile rows of all students enrolled in the calling guru's cohorts
CREATE OR REPLACE FUNCTION public.get_guru_student_profiles()
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  tier_state TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.tier_state
  FROM profiles p
  WHERE p.user_id IN (
    SELECT ce.student_id
    FROM cohort_enrollments ce
    JOIN cohorts c ON ce.cohort_id = c.id
    JOIN guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
  );
$$;

-- Returns trades of one specific student, only if they are enrolled with the calling guru
CREATE OR REPLACE FUNCTION public.get_guru_student_trades(_student_id UUID)
RETURNS SETOF public.trades
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.*
  FROM trades t
  WHERE t.user_id = _student_id
    AND public.guru_has_student(_student_id);
$$;

GRANT EXECUTE ON FUNCTION public.guru_has_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guru_student_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guru_student_trades(UUID) TO authenticated;