
-- 1. lesson_progress table
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

GRANT SELECT, INSERT, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own lesson progress"
  ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own lesson progress"
  ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2. graduate_foundation() - server-authoritative Foundation -> Tier 1 promotion
CREATE OR REPLACE FUNCTION public.graduate_foundation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cur_tier text;
  quiz_passed boolean;
  missing_count int;
  total_count int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT tier_state INTO cur_tier FROM public.profiles WHERE user_id = uid;
  IF cur_tier IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  IF cur_tier <> 'foundation' THEN
    RETURN jsonb_build_object('success', true, 'new_tier', cur_tier, 'note', 'Already promoted');
  END IF;

  -- Check passing quiz attempt
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON q.id = qa.quiz_id
    WHERE qa.user_id = uid AND q.module = 'foundation' AND qa.passed = true
  ) INTO quiz_passed;

  IF NOT quiz_passed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Foundation assessment not passed');
  END IF;

  -- Check all published foundation lessons are completed
  SELECT COUNT(*) INTO total_count
  FROM public.lessons l
  WHERE l.tier_required = 'foundation'
    AND l.content_type = 'platform'
    AND l.is_published = true;

  SELECT COUNT(*) INTO missing_count
  FROM public.lessons l
  WHERE l.tier_required = 'foundation'
    AND l.content_type = 'platform'
    AND l.is_published = true
    AND NOT EXISTS (
      SELECT 1 FROM public.lesson_progress lp
      WHERE lp.user_id = uid AND lp.lesson_id = l.id
    );

  IF missing_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Complete all Foundation lessons first',
      'missing_lessons', missing_count,
      'total_lessons', total_count
    );
  END IF;

  UPDATE public.profiles
    SET tier_state = 'tier1', updated_at = now()
    WHERE user_id = uid AND tier_state = 'foundation';

  RETURN jsonb_build_object('success', true, 'new_tier', 'tier1');
END;
$$;

GRANT EXECUTE ON FUNCTION public.graduate_foundation() TO authenticated;

-- 3. Data cleanup: reset accounts promoted without a passing quiz attempt
UPDATE public.profiles
  SET tier_state = 'foundation', updated_at = now()
  WHERE tier_state <> 'foundation'
    AND role IS DISTINCT FROM 'admin'
    AND plan_state IS DISTINCT FROM 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM public.quiz_attempts q
      WHERE q.user_id = profiles.user_id AND q.passed = true
    );
