CREATE OR REPLACE FUNCTION public.promote_tier(target_tier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_tier text;
  trade_count integer;
  win_rate numeric;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT tier_state INTO current_tier
  FROM profiles
  WHERE user_id = current_user_id;

  IF current_tier IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Foundation -> Tier1 is handled exclusively by graduate_foundation().
  IF target_tier = 'tier1' AND current_tier = 'foundation' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Use graduate_foundation() to graduate from Foundation');

  ELSIF target_tier = 'tier2' AND current_tier = 'tier1' THEN
    SELECT
      COUNT(*),
      CASE WHEN COUNT(*) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / COUNT(*)::numeric * 100, 1)
      ELSE 0 END
    INTO trade_count, win_rate
    FROM trades
    WHERE user_id = current_user_id
      AND session_type = 'simulator';

    IF trade_count < 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Need at least 20 simulator trades', 'current', trade_count);
    END IF;

    IF win_rate < 50 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Need 50%+ win rate', 'current', win_rate);
    END IF;

    UPDATE profiles SET tier_state = 'tier2', updated_at = now()
    WHERE user_id = current_user_id;

    RETURN jsonb_build_object('success', true, 'new_tier', 'tier2');

  ELSIF target_tier = 'tier3' AND current_tier = 'tier2' THEN
    SELECT
      COUNT(*),
      CASE WHEN COUNT(*) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / COUNT(*)::numeric * 100, 1)
      ELSE 0 END
    INTO trade_count, win_rate
    FROM trades
    WHERE user_id = current_user_id
      AND session_type = 'simulator';

    IF trade_count < 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Need at least 20 simulator trades', 'current', trade_count);
    END IF;

    IF win_rate < 55 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Need 55%+ win rate', 'current', win_rate);
    END IF;

    UPDATE profiles SET tier_state = 'tier3', updated_at = now()
    WHERE user_id = current_user_id;

    RETURN jsonb_build_object('success', true, 'new_tier', 'tier3');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid tier promotion path');
  END IF;
END;
$$;