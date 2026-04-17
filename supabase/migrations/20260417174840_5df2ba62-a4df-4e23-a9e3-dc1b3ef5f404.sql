DROP POLICY IF EXISTS cohorts_update_own ON public.cohorts;

CREATE POLICY cohorts_update_own
  ON public.cohorts
  FOR UPDATE
  USING (
    guru_id IN (
      SELECT id FROM public.guru_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    guru_id IN (
      SELECT id FROM public.guru_profiles WHERE user_id = auth.uid()
    )
  );