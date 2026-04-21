ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE OR REPLACE FUNCTION public.sync_plan_state(
  p_user_id uuid,
  p_plan_state text,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    plan_state = p_plan_state,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;