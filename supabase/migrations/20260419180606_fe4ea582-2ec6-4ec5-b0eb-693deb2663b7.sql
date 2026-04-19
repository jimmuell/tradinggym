BEGIN;

ALTER TABLE cohorts            RENAME TO classes;
ALTER TABLE cohort_enrollments RENAME TO class_enrollments;

ALTER TABLE class_enrollments RENAME COLUMN cohort_id TO class_id;
ALTER TABLE guru_content      RENAME COLUMN cohort_id TO class_id;
ALTER TABLE live_sessions     RENAME COLUMN cohort_id TO class_id;

CREATE OR REPLACE FUNCTION public.guru_has_student(_student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    JOIN guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
      AND ce.student_id = _student_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_guru_student_profiles()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, tier_state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id, p.display_name, p.avatar_url, p.tier_state
  FROM profiles p
  WHERE p.user_id IN (
    SELECT ce.student_id
    FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    JOIN guru_profiles g ON c.guru_id = g.id
    WHERE g.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_public_guru_directory()
 RETURNS TABLE(
   id uuid, user_id uuid, display_name text, avatar_url text,
   tagline text, bio text, primary_instrument text, primary_strategy text,
   referral_code text, referral_discount_pct integer, tier_state text,
   win_rate numeric, total_trades bigint, active_students bigint
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    gp.id,
    gp.user_id,
    COALESCE(p.display_name, gp.display_name) AS display_name,
    COALESCE(p.avatar_url, gp.avatar_url)     AS avatar_url,
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
      FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE c.guru_id = gp.id AND ce.status = 'active'
    ) AS active_students
  FROM guru_profiles gp
  LEFT JOIN profiles p ON p.user_id = gp.user_id
  LEFT JOIN trades t ON t.user_id = gp.user_id
  WHERE gp.is_public = true
    AND gp.status = 'active'
  GROUP BY gp.id, p.display_name, p.avatar_url, p.tier_state;
$function$;

DROP POLICY IF EXISTS enrollments_select_guru    ON class_enrollments;
DROP POLICY IF EXISTS enrollments_select_student ON class_enrollments;
DROP POLICY IF EXISTS enrollments_insert_student ON class_enrollments;
DROP POLICY IF EXISTS enrollments_update_student ON class_enrollments;

CREATE POLICY "class_enrollments_select_guru"
  ON class_enrollments FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      JOIN guru_profiles g ON c.guru_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

CREATE POLICY "class_enrollments_select_student"
  ON class_enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "class_enrollments_insert_student"
  ON class_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "class_enrollments_update_student"
  ON class_enrollments FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS guru_content_select_student ON guru_content;

CREATE POLICY "guru_content_select_student"
  ON guru_content FOR SELECT
  USING (
    is_draft = false
    AND class_id IN (
      SELECT ce.class_id FROM class_enrollments ce
      WHERE ce.student_id = auth.uid() AND ce.status = 'active'
    )
  );

DROP POLICY IF EXISTS sessions_select_student ON live_sessions;

CREATE POLICY "sessions_select_student"
  ON live_sessions FOR SELECT
  USING (
    class_id IN (
      SELECT ce.class_id FROM class_enrollments ce
      WHERE ce.student_id = auth.uid() AND ce.status = 'active'
    )
  );

COMMIT;