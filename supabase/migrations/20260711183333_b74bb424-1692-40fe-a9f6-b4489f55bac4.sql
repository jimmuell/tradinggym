CREATE UNIQUE INDEX IF NOT EXISTS quizzes_one_published_platform_per_module
  ON public.quizzes (module)
  WHERE is_published = true
    AND content_type = 'platform';