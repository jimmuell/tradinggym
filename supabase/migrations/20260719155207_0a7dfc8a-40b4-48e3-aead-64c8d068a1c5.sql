create or replace function public.log_failed_recovery_attempt(
  p_email text,
  p_error text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.email_send_log (template_name, recipient_email, status, error_message)
  values ('recovery', left(coalesce(p_email, ''), 320), 'failed', left(coalesce(p_error, ''), 2000));
end;
$$;

revoke all on function public.log_failed_recovery_attempt(text, text) from public;
grant execute on function public.log_failed_recovery_attempt(text, text) to anon, authenticated;