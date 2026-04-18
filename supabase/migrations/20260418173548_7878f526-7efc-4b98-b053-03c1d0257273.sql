-- Add public-profile columns to guru_profiles
ALTER TABLE public.guru_profiles
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS primary_instrument text DEFAULT 'MES',
  ADD COLUMN IF NOT EXISTS primary_strategy text DEFAULT 'ORB',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_discount_pct integer DEFAULT 100;

-- Unique constraint on referral_code (allows multiple NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guru_profiles_referral_code_key'
  ) THEN
    ALTER TABLE public.guru_profiles
      ADD CONSTRAINT guru_profiles_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

-- Public directory: list all public, active gurus with stats
CREATE OR REPLACE FUNCTION public.get_public_guru_directory()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  tagline text,
  bio text,
  primary_instrument text,
  primary_strategy text,
  referral_code text,
  referral_discount_pct integer,
  tier_state text,
  win_rate numeric,
  total_trades bigint,
  active_students bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gp.id,
    gp.user_id,
    COALESCE(p.display_name, gp.display_name) AS display_name,
    COALESCE(p.avatar_url, gp.avatar_url) AS avatar_url,
    gp.tagline,
    gp.bio,
    gp.primary_instrument,
    gp.primary_strategy,
    gp.referral_code,
    gp.referral_discount_pct,
    p.tier_state,
    CASE
      WHEN COUNT(t.id) > 0
        THEN ROUND(
          (COUNT(t.id) FILTER (WHERE t.result = 'win'))::numeric
          / COUNT(t.id)::numeric * 100,
          1
        )
      ELSE NULL
    END AS win_rate,
    COUNT(t.id) AS total_trades,
    (
      SELECT COUNT(*)
      FROM cohort_enrollments ce
      JOIN cohorts c ON ce.cohort_id = c.id
      WHERE c.guru_id = gp.id AND ce.status = 'active'
    ) AS active_students
  FROM guru_profiles gp
  LEFT JOIN profiles p ON p.user_id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.is_public = true
    AND gp.status = 'active'
  GROUP BY gp.id, p.display_name, p.avatar_url, p.tier_state;
$$;

-- Single guru by id (only if public + active)
CREATE OR REPLACE FUNCTION public.get_public_guru_profile(_guru_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  tagline text,
  bio text,
  primary_instrument text,
  primary_strategy text,
  referral_code text,
  referral_discount_pct integer,
  tier_state text,
  win_rate numeric,
  total_trades bigint,
  active_students bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.get_public_guru_directory()
  WHERE id = _guru_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_guru_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_guru_profile(uuid) TO authenticated;