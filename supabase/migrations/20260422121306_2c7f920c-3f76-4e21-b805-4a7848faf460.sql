-- 1A: Remove dev-only RPC that allows self-escalation of plan_state
DROP FUNCTION IF EXISTS public.update_own_plan_state(text);

-- 1B: Tighten guru_profiles read policy
DROP POLICY IF EXISTS students_can_read_active_guru_profiles ON public.guru_profiles;

CREATE OR REPLACE VIEW public.guru_profiles_public AS
SELECT
  id,
  user_id,
  status,
  tagline,
  bio,
  primary_instrument,
  primary_strategy,
  is_public
FROM public.guru_profiles
WHERE status = 'active' AND is_public = true;

CREATE POLICY students_can_read_active_guru_profiles ON public.guru_profiles
  FOR SELECT
  TO authenticated
  USING (status = 'active' AND is_public = true);