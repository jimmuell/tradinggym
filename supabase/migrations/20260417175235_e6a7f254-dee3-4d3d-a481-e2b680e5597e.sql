CREATE TABLE public.cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  stripe_subscription_id TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(cohort_id, student_id)
);

ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_guru"
  ON public.cohort_enrollments FOR SELECT
  USING (
    cohort_id IN (
      SELECT c.id FROM public.cohorts c
      JOIN public.guru_profiles g ON c.guru_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

CREATE POLICY "enrollments_select_student"
  ON public.cohort_enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "enrollments_insert_student"
  ON public.cohort_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "enrollments_update_student"
  ON public.cohort_enrollments FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE INDEX idx_cohort_enrollments_cohort_id ON public.cohort_enrollments(cohort_id);
CREATE INDEX idx_cohort_enrollments_student_id ON public.cohort_enrollments(student_id);

CREATE OR REPLACE VIEW public.guru_student_profiles
WITH (security_invoker = true)
AS
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.tier_state
  FROM public.profiles p
  WHERE p.user_id IN (
    SELECT ce.student_id
    FROM public.cohort_enrollments ce
    JOIN public.cohorts c ON ce.cohort_id = c.id
    JOIN public.guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
  );

GRANT SELECT ON public.guru_student_profiles TO authenticated;