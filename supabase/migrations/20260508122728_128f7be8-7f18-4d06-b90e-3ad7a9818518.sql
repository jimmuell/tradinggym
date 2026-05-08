-- Admin can UPDATE platform lessons
CREATE POLICY admin_update_platform_lessons ON public.lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  );

-- Admin can DELETE platform lessons
CREATE POLICY admin_delete_platform_lessons ON public.lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  );

-- Admin can UPDATE platform quizzes
CREATE POLICY admin_update_platform_quizzes ON public.quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  );

-- Admin can DELETE platform quizzes
CREATE POLICY admin_delete_platform_quizzes ON public.quizzes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND plan_state = 'admin'
    )
  );