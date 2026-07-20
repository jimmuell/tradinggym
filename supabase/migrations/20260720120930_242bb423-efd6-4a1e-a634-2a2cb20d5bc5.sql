DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, display_name text, plan_state text, tier_state text, role text, created_at timestamp with time zone, strategy_count bigint, trade_count bigint, last_sign_in_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.plan_state,
    p.tier_state,
    p.role,
    p.created_at,
    (SELECT COUNT(*) FROM public.strategies s WHERE s.user_id = p.user_id),
    (SELECT COUNT(*) FROM public.trades t WHERE t.user_id = p.user_id),
    u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;