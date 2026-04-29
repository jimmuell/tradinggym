
-- P62: Beta invite codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  assigned_to_email text,
  purpose text DEFAULT 'beta',
  max_uses integer DEFAULT 1,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY invite_codes_admin_select ON public.invite_codes
  FOR SELECT USING (public.is_admin());
CREATE POLICY invite_codes_admin_insert ON public.invite_codes
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY invite_codes_admin_update ON public.invite_codes
  FOR UPDATE USING (public.is_admin());
CREATE POLICY invite_codes_admin_delete ON public.invite_codes
  FOR DELETE USING (public.is_admin());

-- Unique on guru_profiles.user_id needed for ON CONFLICT in admin_approve_guru
CREATE UNIQUE INDEX IF NOT EXISTS guru_profiles_user_id_unique ON public.guru_profiles(user_id);

-- Admin: list users with aggregates
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  plan_state text,
  tier_state text,
  role text,
  created_at timestamptz,
  strategy_count bigint,
  trade_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    (SELECT COUNT(*) FROM public.trades t WHERE t.user_id = p.user_id)
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_plan(target_user_id uuid, new_plan_state text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET plan_state = new_plan_state, updated_at = now() WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_guru_applications()
RETURNS TABLE (
  application_id uuid,
  user_id uuid,
  email text,
  display_name text,
  status text,
  created_at timestamptz,
  plan_state text,
  trading_style text,
  years_experience text,
  what_you_teach text,
  existing_presence text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT
    ga.id,
    ga.user_id,
    u.email::text,
    p.display_name,
    ga.status,
    ga.submitted_at,
    p.plan_state,
    ga.trading_style,
    ga.years_experience,
    ga.what_you_teach,
    ga.existing_presence
  FROM public.guru_applications ga
  JOIN public.profiles p ON p.user_id = ga.user_id
  JOIN auth.users u ON u.id = ga.user_id
  ORDER BY ga.submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_guru(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.guru_applications SET status = 'approved', reviewed_at = now() WHERE user_id = target_user_id;
  INSERT INTO public.guru_profiles (user_id, status, is_public)
  VALUES (target_user_id, 'active', false)
  ON CONFLICT (user_id) DO UPDATE SET status = 'active', updated_at = now();
  UPDATE public.profiles SET role = 'guru', updated_at = now() WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_guru(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.guru_applications SET status = 'rejected', reviewed_at = now() WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'pending_applications', (SELECT COUNT(*) FROM public.guru_applications WHERE status = 'pending'),
    'active_invites', (SELECT COUNT(*) FROM public.invite_codes WHERE is_active = true),
    'pro_plus_users', (SELECT COUNT(*) FROM public.profiles WHERE plan_state IN ('pro','expert','guru','admin'))
  );
END;
$$;
