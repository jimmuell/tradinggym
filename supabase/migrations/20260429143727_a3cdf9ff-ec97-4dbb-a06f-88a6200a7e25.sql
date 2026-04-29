CREATE OR REPLACE FUNCTION public.get_admin_detailed_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_this_week', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'users_this_month', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '30 days'),
    'users_today', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '1 day'),

    'plan_starter', (SELECT COUNT(*) FROM profiles WHERE plan_state = 'starter'),
    'plan_pro', (SELECT COUNT(*) FROM profiles WHERE plan_state = 'pro'),
    'plan_expert', (SELECT COUNT(*) FROM profiles WHERE plan_state = 'expert'),
    'plan_guru', (SELECT COUNT(*) FROM profiles WHERE plan_state = 'guru'),
    'plan_admin', (SELECT COUNT(*) FROM profiles WHERE plan_state = 'admin'),

    'tier_foundation', (SELECT COUNT(*) FROM profiles WHERE tier_state = 'foundation'),
    'tier_1', (SELECT COUNT(*) FROM profiles WHERE tier_state = 'tier1'),
    'tier_2', (SELECT COUNT(*) FROM profiles WHERE tier_state = 'tier2'),
    'tier_3', (SELECT COUNT(*) FROM profiles WHERE tier_state = 'tier3'),
    'tier_coach', (SELECT COUNT(*) FROM profiles WHERE tier_state = 'coach'),

    'mrr', (
      SELECT COALESCE(SUM(CASE
        WHEN plan_state = 'pro' THEN 29
        WHEN plan_state = 'expert' THEN 49
        WHEN plan_state = 'guru' THEN 99
        ELSE 0
      END), 0) FROM profiles
    ),

    'total_strategies', (SELECT COUNT(*) FROM strategies WHERE COALESCE(is_system, false) = false),
    'strategies_this_week', (SELECT COUNT(*) FROM strategies WHERE COALESCE(is_system, false) = false AND created_at > now() - interval '7 days'),
    'total_trades', (SELECT COUNT(*) FROM trades),
    'trades_this_week', (SELECT COUNT(*) FROM trades WHERE created_at > now() - interval '7 days'),
    'total_playback_sessions', (SELECT COUNT(*) FROM strategy_playback_scenarios WHERE COALESCE(is_active, true) = true),

    'active_gurus', (SELECT COUNT(*) FROM guru_profiles WHERE status = 'active'),
    'pending_applications', (SELECT COUNT(*) FROM guru_applications WHERE status = 'pending'),
    'total_classes', (SELECT COUNT(*) FROM classes),
    'total_enrollments', (SELECT COUNT(*) FROM class_enrollments WHERE status = 'active'),

    'active_invites', (SELECT COUNT(*) FROM invite_codes WHERE is_active = true),
    'used_invites', (SELECT COUNT(*) FROM invite_codes WHERE times_used > 0),

    'signup_trend', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          date_trunc('day', created_at)::date AS date,
          COUNT(*) AS signups
        FROM profiles
        WHERE created_at > now() - interval '30 days'
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date
      ) t
    )
  );
END;
$$;