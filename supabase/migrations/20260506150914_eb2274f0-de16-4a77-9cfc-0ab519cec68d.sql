-- 1A. Update get_public_guru_directory
CREATE OR REPLACE FUNCTION public.get_public_guru_directory()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, tagline text, bio text, primary_instrument text, primary_strategy text, referral_code text, referral_discount_pct integer, tier_state text, win_rate numeric, total_trades bigint, active_students bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    gp.id, gp.user_id,
    COALESCE(p.display_name, ga.full_name, split_part(au.email::text, '@', 1)) AS display_name,
    p.avatar_url,
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
  LEFT JOIN guru_applications ga ON ga.user_id = gp.user_id AND ga.status = 'approved'
  LEFT JOIN auth.users au ON au.id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.is_public = true AND gp.status = 'active'
  GROUP BY gp.id, gp.user_id, p.display_name, ga.full_name, au.email, p.avatar_url,
           gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
           gp.referral_code, gp.referral_discount_pct, p.tier_state;
$function$;

-- 1A. Update get_public_guru_profile
CREATE OR REPLACE FUNCTION public.get_public_guru_profile(_guru_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, tagline text, bio text, primary_instrument text, primary_strategy text, referral_code text, referral_discount_pct integer, tier_state text, win_rate numeric, total_trades bigint, active_students bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    gp.id, gp.user_id,
    COALESCE(p.display_name, ga.full_name, split_part(au.email::text, '@', 1)) AS display_name,
    p.avatar_url,
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
  LEFT JOIN guru_applications ga ON ga.user_id = gp.user_id AND ga.status = 'approved'
  LEFT JOIN auth.users au ON au.id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.id = _guru_id AND gp.is_public = true AND gp.status = 'active'
  GROUP BY gp.id, gp.user_id, p.display_name, ga.full_name, au.email, p.avatar_url,
           gp.tagline, gp.bio, gp.primary_instrument, gp.primary_strategy,
           gp.referral_code, gp.referral_discount_pct, p.tier_state;
$function$;

-- 1B. Update get_guru_student_profiles
CREATE OR REPLACE FUNCTION public.get_guru_student_profiles()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, tier_state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id,
    COALESCE(p.display_name, split_part(au.email::text, '@', 1)) AS display_name,
    p.avatar_url, p.tier_state
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  WHERE p.user_id IN (
    SELECT ce.student_id
    FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    JOIN guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
  );
$function$;

-- 1C. Backfill display_name from guru_applications
UPDATE profiles p
SET display_name = ga.full_name, updated_at = now()
FROM guru_applications ga
WHERE ga.user_id = p.user_id
  AND ga.status = 'approved'
  AND (p.display_name IS NULL OR p.display_name = '' OR p.display_name = (SELECT email FROM auth.users WHERE id = p.user_id));

-- 1D. Atomic approve_guru_application function
CREATE OR REPLACE FUNCTION public.approve_guru_application(_application_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_full_name text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT user_id, full_name INTO v_user_id, v_full_name
  FROM public.guru_applications
  WHERE id = _application_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  UPDATE public.guru_applications
  SET status = 'approved', reviewed_at = now()
  WHERE id = _application_id;

  INSERT INTO public.guru_profiles (user_id, status, is_public)
  VALUES (v_user_id, 'active', false)
  ON CONFLICT (user_id) DO UPDATE SET status = 'active', updated_at = now();

  UPDATE public.profiles
  SET display_name = v_full_name, role = 'guru', updated_at = now()
  WHERE user_id = v_user_id
    AND (display_name IS NULL OR display_name = '');

  -- Always ensure role is set even if display_name was already populated
  UPDATE public.profiles
  SET role = 'guru', updated_at = now()
  WHERE user_id = v_user_id AND role <> 'guru';
END;
$function$;