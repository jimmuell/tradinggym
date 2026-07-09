-- 1) Lock down profiles INSERT so users cannot self-assign admin plan_state
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tier_state = 'foundation'
    AND role = 'user'
    AND plan_state = 'starter'
  );

-- 2) Rewrite all plan_state='admin' policy checks to use is_admin() (role-based)

-- courses
DROP POLICY IF EXISTS admin_select_courses ON public.courses;
DROP POLICY IF EXISTS admin_insert_courses ON public.courses;
DROP POLICY IF EXISTS admin_update_courses ON public.courses;
DROP POLICY IF EXISTS admin_delete_courses ON public.courses;
CREATE POLICY admin_select_courses ON public.courses FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_insert_courses ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY admin_update_courses ON public.courses FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_delete_courses ON public.courses FOR DELETE TO authenticated USING (public.is_admin());

-- chapters
DROP POLICY IF EXISTS admin_select_chapters ON public.chapters;
DROP POLICY IF EXISTS admin_insert_chapters ON public.chapters;
DROP POLICY IF EXISTS admin_update_chapters ON public.chapters;
DROP POLICY IF EXISTS admin_delete_chapters ON public.chapters;
CREATE POLICY admin_select_chapters ON public.chapters FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_insert_chapters ON public.chapters FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY admin_update_chapters ON public.chapters FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_delete_chapters ON public.chapters FOR DELETE TO authenticated USING (public.is_admin());

-- lessons
DROP POLICY IF EXISTS admin_select_all_lessons ON public.lessons;
DROP POLICY IF EXISTS admin_insert_platform_lessons ON public.lessons;
DROP POLICY IF EXISTS admin_update_platform_lessons ON public.lessons;
DROP POLICY IF EXISTS admin_delete_platform_lessons ON public.lessons;
CREATE POLICY admin_select_all_lessons ON public.lessons FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_insert_platform_lessons ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY admin_update_platform_lessons ON public.lessons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_delete_platform_lessons ON public.lessons FOR DELETE TO authenticated USING (public.is_admin());

-- quizzes
DROP POLICY IF EXISTS admin_select_all_quizzes ON public.quizzes;
DROP POLICY IF EXISTS admin_insert_platform_quizzes ON public.quizzes;
DROP POLICY IF EXISTS admin_update_platform_quizzes ON public.quizzes;
DROP POLICY IF EXISTS admin_delete_platform_quizzes ON public.quizzes;
CREATE POLICY admin_select_all_quizzes ON public.quizzes FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY admin_insert_platform_quizzes ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY admin_update_platform_quizzes ON public.quizzes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_delete_platform_quizzes ON public.quizzes FOR DELETE TO authenticated USING (public.is_admin());