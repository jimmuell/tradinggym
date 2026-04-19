ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_state text NOT NULL DEFAULT 'starter';

UPDATE public.profiles
  SET plan_state = CASE
    WHEN tier_state = 'coach' THEN 'guru'
    ELSE 'starter'
  END;

CREATE OR REPLACE FUNCTION public.update_own_plan_state(new_plan_state text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.profiles
  SET plan_state = new_plan_state,
      updated_at = now()
  WHERE user_id = auth.uid();
$$;