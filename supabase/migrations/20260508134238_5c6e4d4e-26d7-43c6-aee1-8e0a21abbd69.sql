
-- PART 1: courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tier_required text NOT NULL DEFAULT 'foundation',
  content_type text NOT NULL DEFAULT 'platform',
  author_id uuid REFERENCES auth.users(id),
  class_id uuid REFERENCES public.classes(id),
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_courses ON public.courses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_insert_courses ON public.courses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_update_courses ON public.courses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_delete_courses ON public.courses FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));

CREATE POLICY select_published_platform_courses ON public.courses FOR SELECT
  USING (content_type = 'platform' AND is_published = true);

CREATE POLICY guru_select_own_courses ON public.courses FOR SELECT
  USING (content_type = 'guru' AND auth.uid() = author_id);
CREATE POLICY guru_insert_courses ON public.courses FOR INSERT
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);
CREATE POLICY guru_update_courses ON public.courses FOR UPDATE
  USING (content_type = 'guru' AND auth.uid() = author_id)
  WITH CHECK (content_type = 'guru' AND auth.uid() = author_id);
CREATE POLICY guru_delete_courses ON public.courses FOR DELETE
  USING (content_type = 'guru' AND auth.uid() = author_id);

CREATE POLICY students_select_guru_courses ON public.courses FOR SELECT
  USING (content_type = 'guru' AND is_published = true AND student_is_enrolled_in_class(class_id));

-- PART 2: chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_chapters ON public.chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_insert_chapters ON public.chapters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_update_chapters ON public.chapters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));
CREATE POLICY admin_delete_chapters ON public.chapters FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan_state = 'admin'));

CREATE POLICY select_platform_chapters ON public.chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'platform' AND courses.is_published = true));

CREATE POLICY guru_select_own_chapters ON public.chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.author_id = auth.uid()));
CREATE POLICY guru_insert_chapters ON public.chapters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.author_id = auth.uid()));
CREATE POLICY guru_update_chapters ON public.chapters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.author_id = auth.uid()));
CREATE POLICY guru_delete_chapters ON public.chapters FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.author_id = auth.uid()));

CREATE POLICY students_select_guru_chapters ON public.chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = chapters.course_id AND courses.content_type = 'guru' AND courses.is_published = true AND student_is_enrolled_in_class(courses.class_id)));

-- PART 3: FK columns
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- PART 4: Seed courses + chapters + backfill
INSERT INTO public.courses (id, title, description, tier_required, content_type, display_order, is_published) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Foundation — Trading Literacy', 'Master the basics before your first trade. Five modules covering candles, market structure, sessions, risk management, and your trading plan.', 'foundation', 'platform', 1, true),
  ('a0000001-0000-0000-0000-000000000002', 'Price Action — ORB Strategy', 'Master the Opening Range Breakout strategy using pure price action. No indicators.', 'tier1', 'platform', 2, true),
  ('a0000001-0000-0000-0000-000000000003', 'Confirmation — ORB + VWAP', 'Add VWAP as a directional filter to your ORB trading. Only trade in the direction VWAP confirms.', 'tier2', 'platform', 3, true),
  ('a0000001-0000-0000-0000-000000000004', 'Institutional — AMD + IFVG', 'Learn the institutional delivery model: Accumulation, Manipulation, Distribution with Inverse Fair Value Gap entries.', 'tier3', 'platform', 4, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chapters (id, course_id, title, description, display_order) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Reading Candles', 'Learn to read candlestick charts — the language of price.', 1),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Market Structure', 'Understand trends, ranges, and the pattern of highs and lows.', 2),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Sessions & Time', 'Know when to trade and why session timing matters.', 3),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Risk Management', 'Protect your capital with position sizing and stop losses.', 4),
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'Your Trading Plan', 'Build a written plan that defines your edge and rules.', 5),
  ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000002', 'The Setup', 'Learn the ORB strategy from first principles.', 1),
  ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000002', 'The 6-Step Blueprint', 'Master the complete ORB execution sequence.', 2),
  ('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000002', 'Common Mistakes', 'Learn the mistakes that cause most ORB losses.', 3),
  ('b0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000003', 'The Institutional Anchor', 'Understand VWAP and how it adds directional context.', 1),
  ('b0000001-0000-0000-0000-000000000022', 'a0000001-0000-0000-0000-000000000003', 'Reading Real Setups', 'Learn to read VWAP context on live charts.', 2),
  ('b0000001-0000-0000-0000-000000000031', 'a0000001-0000-0000-0000-000000000004', 'AMD Model', 'Learn the Accumulation, Manipulation, Distribution model.', 1),
  ('b0000001-0000-0000-0000-000000000032', 'a0000001-0000-0000-0000-000000000004', 'Inverse Fair Value Gap', 'Use IFVGs as precision entry points within AMD.', 2)
ON CONFLICT (id) DO NOTHING;

UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000001' WHERE module = 'f1_candles' AND content_type = 'platform';
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000002' WHERE module = 'f2_structure' AND content_type = 'platform';
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000003' WHERE module = 'f3_sessions' AND content_type = 'platform';
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000004' WHERE module = 'f4_risk' AND content_type = 'platform';
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000005' WHERE module = 'f5_plan' AND content_type = 'platform';
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000011' WHERE module = 'tier1_orb' AND content_type = 'platform' AND module_order = 1;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000012' WHERE module = 'tier1_orb' AND content_type = 'platform' AND module_order = 2;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000013' WHERE module = 'tier1_orb' AND content_type = 'platform' AND module_order = 3;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000021' WHERE module = 'tier2_vwap' AND content_type = 'platform' AND module_order = 1;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000022' WHERE module = 'tier2_vwap' AND content_type = 'platform' AND module_order = 2;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000031' WHERE module = 'tier3_amd' AND content_type = 'platform' AND module_order = 1;
UPDATE public.lessons SET chapter_id = 'b0000001-0000-0000-0000-000000000032' WHERE module = 'tier3_amd' AND content_type = 'platform' AND module_order = 2;

UPDATE public.quizzes SET course_id = 'a0000001-0000-0000-0000-000000000001' WHERE module = 'foundation' AND content_type = 'platform';

-- PART 5: Update admin_delete_user RPC to cascade courses + chapters for guru-authored content
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  caller_role text;
  target_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE user_id = auth.uid();
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  SELECT role INTO target_role FROM public.profiles WHERE user_id = _target_user_id;
  IF target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete an admin account';
  END IF;

  DELETE FROM public.quiz_attempts WHERE user_id = _target_user_id;
  DELETE FROM public.live_session_attendance WHERE student_id = _target_user_id;
  DELETE FROM public.live_trades WHERE user_id = _target_user_id;
  DELETE FROM public.trades WHERE user_id = _target_user_id;
  DELETE FROM public.trading_sessions WHERE user_id = _target_user_id;
  DELETE FROM public.checklist_sessions WHERE user_id = _target_user_id;
  DELETE FROM public.checklist_templates WHERE user_id = _target_user_id;
  DELETE FROM public.strategy_extractions WHERE user_id = _target_user_id;
  DELETE FROM public.backtest_runs WHERE user_id = _target_user_id;
  DELETE FROM public.strategies WHERE user_id = _target_user_id;
  DELETE FROM public.class_enrollments WHERE student_id = _target_user_id;

  DELETE FROM public.guru_referrals
    WHERE guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = _target_user_id)
       OR referred_user_id = _target_user_id;

  DELETE FROM public.guru_content
    WHERE guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = _target_user_id);

  DELETE FROM public.live_session_attendance
    WHERE session_id IN (
      SELECT ls.id FROM public.live_sessions ls
      JOIN public.guru_profiles gp ON gp.id = ls.guru_id
      WHERE gp.user_id = _target_user_id
    );
  DELETE FROM public.live_sessions
    WHERE guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = _target_user_id);

  -- Delete guru-authored chapters + courses (CC-1)
  DELETE FROM public.chapters WHERE course_id IN (
    SELECT id FROM public.courses WHERE author_id = _target_user_id
  );
  DELETE FROM public.courses WHERE author_id = _target_user_id;

  DELETE FROM public.quizzes
    WHERE lesson_id IN (
      SELECT l.id FROM public.lessons l
      JOIN public.classes c ON c.id = l.class_id
      JOIN public.guru_profiles gp ON gp.id = c.guru_id
      WHERE gp.user_id = _target_user_id
    );
  DELETE FROM public.lessons
    WHERE class_id IN (
      SELECT c.id FROM public.classes c
      JOIN public.guru_profiles gp ON gp.id = c.guru_id
      WHERE gp.user_id = _target_user_id
    );
  DELETE FROM public.class_enrollments
    WHERE class_id IN (
      SELECT c.id FROM public.classes c
      JOIN public.guru_profiles gp ON gp.id = c.guru_id
      WHERE gp.user_id = _target_user_id
    );
  DELETE FROM public.classes
    WHERE guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = _target_user_id);

  DELETE FROM public.guru_applications WHERE user_id = _target_user_id;
  DELETE FROM public.guru_profiles WHERE user_id = _target_user_id;
  DELETE FROM public.investor_notes WHERE author_id = _target_user_id;
  DELETE FROM public.investor_documents WHERE uploaded_by = _target_user_id;
  DELETE FROM public.cost_settings WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;

  DELETE FROM auth.users WHERE id = _target_user_id;

  RETURN jsonb_build_object('deleted', true, 'user_id', _target_user_id);
END;
$function$;
