
-- Fix 1: Replace UPDATE policy with security-definer function for profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_own_profile TO authenticated;

-- Fix 2: Replace open system strategy policy with tier-aware policy
DROP POLICY IF EXISTS "Users can read system strategies" ON public.strategies;

CREATE POLICY "Users can read system strategies by tier"
  ON public.strategies FOR SELECT
  USING (
    is_system = false
    OR
    (
      is_system = true
      AND (
        tier_required = 'foundation'
        OR (tier_required = 'tier1' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND tier_state IN ('tier1','tier2','tier3','coach')
        ))
        OR (tier_required = 'tier2' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND tier_state IN ('tier2','tier3','coach')
        ))
        OR (tier_required = 'tier3' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND tier_state IN ('tier3','coach')
        ))
      )
    )
  );
