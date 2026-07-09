
CREATE OR REPLACE FUNCTION public.enforce_free_strategy_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_plan text;
  existing_count int;
BEGIN
  -- Only enforce on custom (user-owned, non-system) strategies
  IF NEW.user_id IS NULL OR COALESCE(NEW.is_system, false) = true THEN
    RETURN NEW;
  END IF;

  SELECT plan_state INTO owner_plan
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Paid plans are uncapped
  IF owner_plan IN ('pro', 'expert', 'guru', 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO existing_count
  FROM public.strategies
  WHERE user_id = NEW.user_id
    AND COALESCE(is_system, false) = false;

  IF existing_count >= 1 THEN
    RAISE EXCEPTION 'FREE_STRATEGY_LIMIT: Free plan is limited to 1 custom strategy. Upgrade to Pro to create more.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_strategy_limit_trg ON public.strategies;
CREATE TRIGGER enforce_free_strategy_limit_trg
BEFORE INSERT ON public.strategies
FOR EACH ROW
EXECUTE FUNCTION public.enforce_free_strategy_limit();
