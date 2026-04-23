ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS responses jsonb NOT NULL DEFAULT '[]'::jsonb;