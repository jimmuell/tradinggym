DROP POLICY IF EXISTS "sessions_update_guru" ON public.live_sessions;

CREATE POLICY "sessions_update_guru"
  ON public.live_sessions
  FOR UPDATE
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );