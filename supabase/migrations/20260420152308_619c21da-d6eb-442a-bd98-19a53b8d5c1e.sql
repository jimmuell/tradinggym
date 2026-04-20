CREATE OR REPLACE FUNCTION public.get_public_guru_directory()
RETURNS TABLE (
  id uuid, user_id uuid, display_name text, avatar_url text,
  tagline text, bio text, primary_instrument text, primary_strategy text,
  referral_code text, referral_discount_pct integer, tier_state text,
  win_rate numeric, total_trades bigint, active_students bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    gp.id, gp.user_id, p.display_name, p.avatar_url,
    gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
    gp.referral_code, gp.referral_discount_pct, p.tier_state,
    CASE WHEN COUNT(t.id) = 0 THEN NULL
      ELSE ROUND(COUNT(t.id) FILTER (WHERE t.result = 'win')::numeric / NULLIF(COUNT(t.id), 0) * 100, 1)
    END AS win_rate,
    COUNT(t.id) AS total_trades,
    (SELECT COUNT(DISTINCT ce.student_id) FROM class_enrollments ce
     JOIN classes c ON ce.class_id = c.id
     WHERE c.guru_id = gp.id AND ce.status = 'active') AS active_students
  FROM guru_profiles gp
  JOIN profiles p ON p.user_id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.is_public = true AND gp.status = 'active'
  GROUP BY gp.id, gp.user_id, p.display_name, p.avatar_url,
           gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
           gp.referral_code, gp.referral_discount_pct, p.tier_state;
$$;

CREATE OR REPLACE FUNCTION public.get_public_guru_profile(_guru_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, display_name text, avatar_url text,
  tagline text, bio text, primary_instrument text, primary_strategy text,
  referral_code text, referral_discount_pct integer, tier_state text,
  win_rate numeric, total_trades bigint, active_students bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    gp.id, gp.user_id, p.display_name, p.avatar_url,
    gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
    gp.referral_code, gp.referral_discount_pct, p.tier_state,
    CASE WHEN COUNT(t.id) = 0 THEN NULL
      ELSE ROUND(COUNT(t.id) FILTER (WHERE t.result = 'win')::numeric / NULLIF(COUNT(t.id), 0) * 100, 1)
    END AS win_rate,
    COUNT(t.id) AS total_trades,
    (SELECT COUNT(DISTINCT ce.student_id) FROM class_enrollments ce
     JOIN classes c ON ce.class_id = c.id
     WHERE c.guru_id = gp.id AND ce.status = 'active') AS active_students
  FROM guru_profiles gp
  JOIN profiles p ON p.user_id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.id = _guru_id AND gp.is_public = true AND gp.status = 'active'
  GROUP BY gp.id, gp.user_id, p.display_name, p.avatar_url,
           gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
           gp.referral_code, gp.referral_discount_pct, p.tier_state;
$$;

ALTER TABLE public.guru_profiles DROP COLUMN IF EXISTS display_name;
ALTER TABLE public.guru_profiles DROP COLUMN IF EXISTS avatar_url;