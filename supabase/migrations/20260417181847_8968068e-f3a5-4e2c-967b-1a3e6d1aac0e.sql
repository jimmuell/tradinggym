DROP POLICY IF EXISTS "guru_content_update_guru" ON public.guru_content;

CREATE POLICY "guru_content_update_guru"
  ON public.guru_content
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