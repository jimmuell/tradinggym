
# ADR-040 — `backtest-callback` edge function

Implement the engine callback path so results can be written without a Railway-side service_role key.

## Changes

1. **Secret** — add `BACKTEST_CALLBACK_SECRET` via `add_secret` (user supplies value in the secure form).
2. **New edge function** `supabase/functions/backtest-callback/index.ts` — exact code from the task: constant-time secret check, column whitelist, UUID validation, terminal-state idempotency guard, service_role UPDATE on `backtest_runs`.
3. **`supabase/config.toml`** — add `[functions.backtest-callback] verify_jwt = false`.
4. **`supabase/functions/run-backtest/index.ts`** — in the `/run/async` POST body, add `callback_url` (`${supabaseUrl}/functions/v1/backtest-callback`) and `callback_secret` (from env). Remove the stale `" (engine missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"` hint from the 503 branch. Nothing else touched.
5. **Docs** — append Callback Contract section to `docs/BACKTEST_ENGINE_SPEC.md`; add ADR-040 to `docs/DECISIONS.md`.

## Out of scope
Engine repo changes, frontend, DB schema, other edge functions.

## Verify
After the engine repo ships its side, run a Quick test (1 week) and watch the row transition + `backtest-callback` logs for 200s.
