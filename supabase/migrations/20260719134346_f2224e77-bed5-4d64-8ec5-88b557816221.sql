
-- Durability + secret-handling fix for the nightly plan reconciliation cron.
-- Captures reconcile-subscriptions-nightly in a migration so DB rebuilds do not
-- silently drop it. Secrets are read from Vault at run time; nothing sensitive
-- appears in cron.job.command or in this file.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Runtime dispatcher: reads reconcile_shared_secret + reconcile_anon_key from
-- Vault and POSTs to the reconcile-subscriptions edge function. SECURITY
-- DEFINER because vault.decrypted_secrets is not readable by lower roles.
CREATE OR REPLACE FUNCTION public.run_reconcile_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_secret text;
  v_anon   text;
BEGIN
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'reconcile_shared_secret';
  SELECT decrypted_secret INTO v_anon
    FROM vault.decrypted_secrets WHERE name = 'reconcile_anon_key';

  IF v_secret IS NULL OR v_anon IS NULL THEN
    RAISE WARNING 'run_reconcile_subscriptions: vault secret(s) missing; skipping';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://iwvpbnhsabnioxrlddqx.supabase.co/functions/v1/reconcile-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-reconcile-secret', v_secret
    ),
    body := '{}'::jsonb
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.run_reconcile_subscriptions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_reconcile_subscriptions() FROM anon, authenticated;

-- Re-schedule the nightly cron. Command text is a bare SQL call — safe to
-- commit and to expose to anyone with SELECT on cron.job.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-subscriptions-nightly') THEN
    PERFORM cron.unschedule('reconcile-subscriptions-nightly');
  END IF;
  PERFORM cron.schedule(
    'reconcile-subscriptions-nightly',
    '0 3 * * *',
    $cron$ select public.run_reconcile_subscriptions(); $cron$
  );
END;
$$;
