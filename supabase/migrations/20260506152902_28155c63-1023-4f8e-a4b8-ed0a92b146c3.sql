CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;