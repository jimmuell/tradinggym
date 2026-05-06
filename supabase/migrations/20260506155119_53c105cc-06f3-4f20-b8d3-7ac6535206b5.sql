CREATE OR REPLACE FUNCTION public.admin_check_orphan_records()
RETURNS TABLE(table_name TEXT, orphan_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE user_id = auth.uid();
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 'profiles'::text, count(*) FROM public.profiles WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'trades', count(*) FROM public.trades WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'live_trades', count(*) FROM public.live_trades WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'trading_sessions', count(*) FROM public.trading_sessions WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'strategies', count(*) FROM public.strategies WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'backtest_runs', count(*) FROM public.backtest_runs WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'checklist_templates', count(*) FROM public.checklist_templates WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'checklist_sessions', count(*) FROM public.checklist_sessions WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'strategy_extractions', count(*) FROM public.strategy_extractions WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'quiz_attempts', count(*) FROM public.quiz_attempts WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'guru_applications', count(*) FROM public.guru_applications WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'guru_profiles', count(*) FROM public.guru_profiles WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'investor_notes', count(*) FROM public.investor_notes WHERE author_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'investor_documents', count(*) FROM public.investor_documents WHERE uploaded_by IS NOT NULL AND uploaded_by NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'cost_settings', count(*) FROM public.cost_settings WHERE user_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'class_enrollments', count(*) FROM public.class_enrollments WHERE student_id NOT IN (SELECT id FROM auth.users)
  UNION ALL
  SELECT 'live_session_attendance', count(*) FROM public.live_session_attendance WHERE student_id NOT IN (SELECT id FROM auth.users)
  ORDER BY 2 DESC;
END;
$$;