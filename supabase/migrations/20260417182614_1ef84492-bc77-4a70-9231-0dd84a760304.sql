-- live_sessions table
CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id UUID NOT NULL REFERENCES public.guru_profiles(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended')),
  partykit_room_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_guru"
  ON public.live_sessions FOR SELECT
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "sessions_insert_guru"
  ON public.live_sessions FOR INSERT
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "sessions_update_guru"
  ON public.live_sessions FOR UPDATE
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "sessions_delete_scheduled_guru"
  ON public.live_sessions FOR DELETE
  USING (
    status = 'scheduled'
    AND guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "sessions_select_student"
  ON public.live_sessions FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM public.cohort_enrollments
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- live_session_attendance table
CREATE TABLE public.live_session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(session_id, student_id)
);

ALTER TABLE public.live_session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_guru"
  ON public.live_session_attendance FOR SELECT
  USING (
    session_id IN (
      SELECT ls.id FROM public.live_sessions ls
      JOIN public.guru_profiles g ON ls.guru_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_insert_student"
  ON public.live_session_attendance FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "attendance_update_student"
  ON public.live_session_attendance FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "attendance_select_student"
  ON public.live_session_attendance FOR SELECT
  USING (auth.uid() = student_id);