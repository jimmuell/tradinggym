
-- 1. Add heartbeat column
ALTER TABLE public.backtest_runs
  ADD COLUMN IF NOT EXISTS last_progress_at timestamptz;

-- 2. Backfill existing rows so the watchdog does not immediately flip healthy old rows
UPDATE public.backtest_runs
   SET last_progress_at = created_at
 WHERE last_progress_at IS NULL;

-- 3. Rewrite fail_stale_backtests() to use last_progress_at with a plain-English message.
--    Heartbeat granularity: the engine posts progress only at stage boundaries
--    (e.g. 50), so 10 minutes of silence is the correct threshold — a shorter one
--    would false-positive on a healthy long run mid-stage.
CREATE OR REPLACE FUNCTION public.fail_stale_backtests()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  with stale as (
    update backtest_runs
       set status = 'failed',
           error_message = 'The backtest engine stopped responding (no progress for over 10 minutes). This usually means the engine crashed or the date range was too large. Please try a shorter range and run it again.'
     where status in ('pending', 'running')
       and coalesce(last_progress_at, created_at) < now() - interval '10 minutes'
    returning 1
  )
  select count(*)::int from stale;
$function$;

-- 4. Schedule the watchdog every minute. Captured in-migration so a rebuild recreates it.
--    Safe to commit because the payload is a same-project SQL function call with no
--    URL, secret, or user-specific data (unlike net.http_post schedules).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fail-stale-backtests-watchdog') THEN
    PERFORM cron.unschedule('fail-stale-backtests-watchdog');
  END IF;
  PERFORM cron.schedule(
    'fail-stale-backtests-watchdog',
    '* * * * *',
    $cron$ select public.fail_stale_backtests(); $cron$
  );
END;
$$;
