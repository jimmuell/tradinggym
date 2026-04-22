-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  module text NOT NULL,
  module_order integer NOT NULL DEFAULT 0,
  tier_required text NOT NULL DEFAULT 'foundation',
  content_type text NOT NULL DEFAULT 'platform',
  author_id uuid REFERENCES auth.users(id),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_minutes integer DEFAULT 10,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_select_platform ON public.lessons
  FOR SELECT TO authenticated
  USING (content_type = 'platform' AND is_published = true);

CREATE POLICY lessons_select_guru ON public.lessons
  FOR SELECT TO authenticated
  USING (content_type = 'guru' AND is_published = true AND public.student_is_enrolled_in_class(class_id));

CREATE POLICY lessons_insert_guru ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);

CREATE POLICY lessons_update_guru ON public.lessons
  FOR UPDATE TO authenticated
  USING (content_type = 'guru' AND auth.uid() = author_id)
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);

CREATE POLICY lessons_delete_guru ON public.lessons
  FOR DELETE TO authenticated
  USING (content_type = 'guru' AND auth.uid() = author_id);

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module);
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON public.lessons(class_id);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  module text NOT NULL,
  title text NOT NULL,
  pass_threshold integer NOT NULL DEFAULT 80,
  content_type text NOT NULL DEFAULT 'platform',
  author_id uuid REFERENCES auth.users(id),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quizzes_select_platform ON public.quizzes
  FOR SELECT TO authenticated
  USING (content_type = 'platform' AND is_published = true);

CREATE POLICY quizzes_select_guru ON public.quizzes
  FOR SELECT TO authenticated
  USING (content_type = 'guru' AND is_published = true AND lesson_id IN (
    SELECT id FROM public.lessons WHERE public.student_is_enrolled_in_class(class_id)
  ));

CREATE POLICY quizzes_insert_guru ON public.quizzes
  FOR INSERT TO authenticated
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);

CREATE POLICY quizzes_update_guru ON public.quizzes
  FOR UPDATE TO authenticated
  USING (content_type = 'guru' AND auth.uid() = author_id)
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);

CREATE POLICY quizzes_delete_guru ON public.quizzes
  FOR DELETE TO authenticated
  USING (content_type = 'guru' AND auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_module ON public.quizzes(module);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_attempts_select_own ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY quiz_attempts_insert_own ON public.quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);