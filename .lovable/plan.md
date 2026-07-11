
Agree. Drop it.

Your reasoning is right: `sandbox_exec` is the exec-tool's psql role (not god-mode like `service_role`), so granting it EXECUTE on a SECURITY DEFINER that takes arbitrary text and schedules it as pg_cron SQL is exactly the escalation shape from the Jul-9 SEC-privesc fix. The helper existed only to keep the new secret out of tool-call payloads during one rotation — that job is done. Rotations are rare and the pattern is now written down in `DECISIONS.md`; recreating it takes minutes.

## Change

**Migration** — one statement:

```sql
DROP FUNCTION IF EXISTS public._reschedule_reconcile_cron(text);
```

That removes both the definer surface and the `sandbox_exec` grant in one shot.

## Also update `docs/DECISIONS.md`

Append a short note to the reconciliation-cron ADR:

- The rotation on 2026-07-11 temporarily created `public._reschedule_reconcile_cron(text)` (SECURITY DEFINER) to keep the new secret out of tool-call payloads.
- It was dropped immediately after use. Rationale: a SECURITY DEFINER that schedules arbitrary text as pg_cron SQL is a privilege-escalation surface (same shape as the Jul-9 SEC-privesc fix) and rotations are too rare to justify keeping it.
- **Next rotation runbook:** re-create the helper temporarily → call it with the new secret → `DROP FUNCTION` in the same session. Do NOT grant EXECUTE to any role other than `service_role`.

## Not doing

- Not touching `reconcile-subscriptions` code, the cron entry (jobid 3 stays), or the shared secret. Cron still carries the current secret in `cron.job.command` as before.
- Not switching to the "keep it but revoke sandbox_exec" alternative — a definer that only `service_role` can call still lives forever, and the value is marginal.

Approve and I'll ship the migration + doc edit.
