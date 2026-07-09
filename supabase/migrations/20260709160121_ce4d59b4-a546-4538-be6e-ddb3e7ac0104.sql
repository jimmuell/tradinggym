-- Remove the policy that leaks sensitive Stripe identifiers to all authenticated users
DROP POLICY IF EXISTS "students_can_read_active_guru_profiles" ON public.guru_profiles;

-- Ensure the safe public view exists (idempotent) with only non-sensitive columns
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

-- Grant students and service_role access to the safe view only
GRANT SELECT ON public.guru_profiles_public TO authenticated;
GRANT SELECT ON public.guru_profiles_public TO service_role;
GRANT SELECT ON public.guru_profiles_public TO anon;