-- Re-add narrow SELECT policy for signed-in users (active, public profiles only)
DROP POLICY IF EXISTS "students_can_read_active_guru_profiles" ON public.guru_profiles;
CREATE POLICY "students_can_read_active_guru_profiles"
  ON public.guru_profiles
  FOR SELECT
  TO authenticated
  USING (status = 'active' AND is_public = true);

-- Lock down sensitive Stripe columns at the column-privilege layer.
-- Reset baseline, then grant SELECT on all columns EXCEPT the stripe identifier columns.
REVOKE SELECT ON public.guru_profiles FROM authenticated, anon;

GRANT SELECT (
  id, user_id, bio, slug, status, trial_ends_at, trial_dismissed_count,
  created_at, updated_at, tagline, primary_instrument, primary_strategy,
  is_public, referral_code, referral_discount_pct
) ON public.guru_profiles TO authenticated;

-- Keep INSERT/UPDATE/DELETE grants intact for owner policies to function.
GRANT INSERT, UPDATE, DELETE ON public.guru_profiles TO authenticated;
GRANT ALL ON public.guru_profiles TO service_role;