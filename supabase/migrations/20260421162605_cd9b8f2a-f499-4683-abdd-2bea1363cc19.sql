ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_verified boolean DEFAULT false;

CREATE OR REPLACE FUNCTION public.accept_terms(
  p_tos_accepted boolean DEFAULT true,
  p_age_verified boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    tos_accepted_at = CASE WHEN p_tos_accepted THEN now() ELSE tos_accepted_at END,
    age_verified = CASE WHEN p_age_verified THEN true ELSE age_verified END,
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;