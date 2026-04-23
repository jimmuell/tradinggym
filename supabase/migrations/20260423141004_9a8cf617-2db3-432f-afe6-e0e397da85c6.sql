DROP POLICY IF EXISTS "lessons_select_guru" ON public.lessons;

CREATE POLICY "lessons_select_guru_author"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  content_type = 'guru'
  AND auth.uid() = author_id
);

CREATE POLICY "lessons_select_guru_students"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  content_type = 'guru'
  AND is_published = true
  AND student_is_enrolled_in_class(class_id)
);