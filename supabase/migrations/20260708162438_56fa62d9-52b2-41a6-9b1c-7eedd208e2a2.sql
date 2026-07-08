-- Revoke unintended anon privileges on quiz_attempts (defense-in-depth; RLS already blocks).
REVOKE ALL ON public.quiz_attempts FROM anon;
REVOKE ALL ON public.quiz_attempts FROM PUBLIC;

-- Ensure authenticated is read-only and service_role retains full access.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.quiz_attempts FROM authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

-- Cleanup any leftover test rows planted during QA (safe no-op if none remain).
DELETE FROM public.quiz_attempts qa
USING public.quizzes q
WHERE qa.quiz_id = q.id
  AND qa.passed = true
  AND (qa.total_questions = 0 OR (qa.score::numeric * 100 / qa.total_questions) < q.pass_threshold);

DELETE FROM public.quiz_attempts
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'jamesloganmueller+qasec%@gmail.com'
);