ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS risk_acknowledged_at TIMESTAMPTZ DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_risk_acknowledged_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    risk_acknowledged_at = COALESCE(p_risk_acknowledged_at, risk_acknowledged_at),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$function$;