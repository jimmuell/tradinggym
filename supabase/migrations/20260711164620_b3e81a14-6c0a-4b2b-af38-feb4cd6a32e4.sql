create or replace function public._reschedule_reconcile_cron(p_secret text)
returns bigint
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_job_id bigint;
  v_anon   text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dnBibmhzYWJuaW94cmxkZHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzk5MzMsImV4cCI6MjA5MTY1NTkzM30.OAmF_hLVjDx8scR0O5ofXPHX9RcF3rleczruXvSjKcQ';
begin
  begin
    perform cron.unschedule('reconcile-subscriptions-nightly');
  exception when others then null;
  end;

  v_job_id := cron.schedule(
    'reconcile-subscriptions-nightly',
    '0 3 * * *',
    format(
      $c$select net.http_post(
           url := %L,
           headers := jsonb_build_object(
             'Content-Type', 'application/json',
             'Authorization', %L,
             'x-reconcile-secret', %L
           ),
           body := '{}'::jsonb
         );$c$,
      'https://iwvpbnhsabnioxrlddqx.supabase.co/functions/v1/reconcile-subscriptions',
      'Bearer ' || v_anon,
      p_secret
    )
  );

  return v_job_id;
end
$fn$;

revoke all on function public._reschedule_reconcile_cron(text) from public, anon, authenticated;