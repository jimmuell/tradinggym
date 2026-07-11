# Architecture Decision Records — tradinggym

Decisions that govern the tradinggym Lovable app and its `run-backtest` Supabase edge function.

> Engine-side ADRs are numbered in a shared sequence across `back-tester` and `mes-orb-strategy`
> (016/017/019 in back-tester; 018/020–022 in mes-orb-strategy). To avoid colliding with that
> sequence, app-side decisions here are kept as **titled records** rather than numbered ADRs.

---

## Edge function requires the engine API key from env (no committed fallback)

**Status:** Accepted.

**Context:** `supabase/functions/run-backtest/index.ts` read the engine key with a hardcoded
fallback (`|| "tg-backtest-dev-2026"`), committing a dev key to the repo — the exact anti-pattern
the engine removed in its own PR #1 hardening.

**Decision:** Require `BACKTEST_ENGINE_API_KEY` from the environment
(`Deno.env.get("BACKTEST_ENGINE_API_KEY")!`) with no fallback — fail loud if unset, matching the
hardened engine (503 when unset, 401 when wrong).

**Consequence:** No secret in version control; the dead default (which the hardened engine rejects
anyway) is gone (PR #4, commit `d9ebeea`). Confirmed live at `run-backtest/index.ts:61`.

---

## Validation budget plumbed through the edge function (Step 2a)

**Status:** Accepted.

**Context:** The validation budget was hardcoded in the edge function; callers could not control it.

**Decision:** `run-backtest` reads `run_validation` (default `true`) and `validation_iterations`
(default `2000`, clamped to the engine's accepted 100–20000 range via `Math.min`/`Math.max`),
forwards both into the engine `/run` request, and persists the values used onto the `backtest_runs`
row. New DB columns were added with matching defaults and a CHECK constraint.

**Consequence:** Backend foundation for the Step 2b validation-controls UI. No behavior change when
callers omit the fields — an untouched request validates with 2000 iterations exactly as before
(PR #2, commit `b027549`). Columns: `run_validation boolean NOT NULL DEFAULT true`, `validation_iterations
integer NOT NULL DEFAULT 2000 CHECK (validation_iterations BETWEEN 100 AND 20000)`, plus
`validation JSONB` and `validation_error TEXT`.

---

## Status — backtest validation pipeline live end-to-end (2026-06-26)

Live end-to-end and verified on a real backtest: tradinggym → `run-backtest` edge function →
mes-orb-strategy engine (`/run`) → KPIs + honest validation verdict → persisted to `backtest_runs`
→ verdict panel renders (a pass is labeled "Promising," never "PASS").

- Engine: tz-bounds fix deployed (mes-orb-strategy PR #8, `732989b`). Model fixed to
`claude-sonnet-4-6` (retired `claude-sonnet-4-20250514` removed; PR #3, `9b75176`).
- Schema: `backtest_runs` has `validation`, `validation_error`, `run_validation`,
`validation_iterations`.
- Edge function: reviewed; engine key required from env (no fallback). Import-stripping + tz guards
  retained as harmless defense-in-depth.
- Reference: `docs/BACKTEST_ENGINE_SPEC.md` (engine contract + ownership boundary).

**Deploy truth for this stack:** "merged to main" / "Lovable synced" does NOT equal "live." Verify
at the edge-function runtime AND the live DB (migrations applied), not just GitHub. Engine-side
tracebacks (`engine.py` / `server.py`) are fixed in mes-orb-strategy via Claude Code, never in the
edge function.

---

## Stop-loss behavior confirmed correct — not a bug (2026-06-26)

**Status:** Accepted — engine behavior is correct; no code change. Observability added
(mes-orb-strategy PR #10).

**Context:** A 0.1% (~5-point) stop did not visibly cap losses; average losers stayed near
~$85 (~0.3%), suggesting `stop_loss_pct` was not being applied.

**Decision (finding):** Instrumentation — not inference — showed the row writes the stop, the
edge function forwards it (`ENGINE_REQUEST_RISK`), and the engine applies it
(`received_stop_loss_pct`, `sl_exit_count: 36`): stops do fire. Losers still average ~0.3%
because the engine executes pending **signal exits at the next bar's OPEN, before** the TP/SL
check; the stop only binds intrabar on bars with no pending exit. A 0.1% stop is simply too
tight for multi-year MES, where bar ranges and overnight gaps exceed 5 points. To see a stop
bind, use a wider stop and/or a longer-holding strategy.

**Consequence:** No edge-function or engine logic change. Engine PR #10 adds
`received_stop_loss_pct`, `received_take_profit_pct`, `sl_exit_count`, `tp_exit_count` to
`kpis`, persisted to `backtest_runs.results_detail` — permanent exit-reason visibility so this
is answerable in one run instead of by comparing confounded aggregates.

---

## Signal determinism via content-addressed cache (BT-DET-1)

**Status:** Accepted — implemented and verified live (PR #9, commit `5d59336`).

**Context:** `run-backtest` regenerated `ai_signal_code` by calling Claude on every run. The
API is not bit-deterministic even at temperature 0, so the same strategy + settings produced
15 / 293 / 519 trades across runs. This blocked clean risk-parameter validation (you cannot
A/B a stop on identical trades if the trades change underneath you) and Step 4
(compare/optimize).

**Decision:** Cache generated signal code in a dedicated, content-addressed `signal_cache`
table keyed by `sha256(stableStringify({ v: 1, model, prompt_fp, timeframe, cfg }))`, where
`prompt_fp` = first 16 hex of `sha256(systemPrompt)` and `cfg` = the strategy config with
`id`/`user_id`/`created_at` stripped and keys recursively sorted. Generate once, reuse on every
run; a changed input yields a new hash (auto-invalidation); `force_regenerate: true` bypasses
and overwrites. Chosen over a seed / temperature=0 (no bit-identical guarantee, so drift
remains) and over a column on `strategies` (a dedicated table also covers ad-hoc runs with no
`strategy_id`, keeps the multi-KB code blob off RLS-returned client rows, and lets prompt
versions coexist instead of overwriting one slot). Date range, `stop_loss_pct`,
`take_profit_pct`, `qty_value`, `initial_balance`, `commission_pct`, and `direction` are
deliberately excluded from the hash — they are applied by the engine downstream and are varied
during optimize — and the contaminating date-range / tick-risk lines were removed from the
prompt sent to Claude.

**Consequence:** Run-to-run signal determinism; a cache hit skips the Claude call entirely.
`signal_cache` stores the RAW code (the `timezoneGuard` prefix is re-applied at use time and is
not hashed or cached); `backtest_runs.ai_signal_code` still records the full guard + body that
ran. RLS enabled with no policies (deny-all to clients; the edge function uses the service-role
key). Verified live: run `65fc0a13` logged `SIGNAL_CACHE status:"miss"`, hash `c0d146c2…c66abe`,
329 trades → separate run `bab32cd3` logged `status:"hit"` on the same hash, 329 trades —
identical; `signal_cache.hit_count = 1`. Migration `20260627150000_signal_cache.sql`; edge
function `supabase/functions/run-backtest/index.ts`.

---

## Status — signal determinism live end-to-end (2026-06-27)

BT-DET-1 shipped and verified: tradinggym → `run-backtest` → `signal_cache` (miss → generate →
reuse) → engine → KPIs persisted. Same strategy config + timeframe now reuse the cached
`ai_signal_code` regardless of date range or risk params, so risk-parameter validation and
compare/optimize operate on identical trades.

- Schema: `signal_cache` (hash PK, raw `signal_code`, `model` / `prompt_fp` / `timeframe` /
  `strategy_id` provenance, `created_at` / `last_used_at` / `hit_count`), RLS on with no
  policies. `backtest_runs` carries `stop_loss_pct` / `take_profit_pct` / `qty_value` (Step 3,
  percent-native) on top of the Step 2a validation columns.
- Edge function: cache lookup before the Claude call; Claude call only on miss /
  `force_regenerate`; `SIGNAL_CACHE` diagnostic log (`status` miss|hit|forced + hash + model +
  prompt_fp).
- Verification: hash `c0d146c2…c66abe`, miss(329) → hit(329), `hit_count = 1`.
- Note: `force_regenerate` is invocable via the function body; no UI control yet (optional
  follow-up).

**Deploy truth reaffirmed:** Lovable did NOT auto-apply the migration (the table was absent
until the SQL was run manually) and did NOT auto-redeploy the edge function on merge (the
`SIGNAL_CACHE` log appeared only after a manual redeploy). Verify at the live DB
(`information_schema`) AND the function runtime (logs), never from the deploy counter alone.

**Next:** Step 4 (explainability / compare / optimize) → deferred engine round (point/tick
stops → ADR-023; slippage model → ADR-024, both parked) → back-tester package rehome.

## ADR-040 — Engine writes results via `backtest-callback`, not direct DB

**Context:** Lovable Cloud does not expose the `SUPABASE_SERVICE_ROLE_KEY` to users or agents.
The engine on Railway therefore cannot be given the credentials needed to `UPDATE backtest_runs`
directly, which was the ADR-037 async assumption.

**Decision:** The engine POSTs progress/results to a new public edge function
`backtest-callback` running inside Lovable Cloud (where the service_role client is trivially
available). The engine authenticates with `X-Callback-Secret: <BACKTEST_CALLBACK_SECRET>`;
`run-backtest` passes the same secret + callback URL to `/run/async` on every job.

**Guarantees:**
- Column whitelist inside the callback — a leaked secret cannot scribble arbitrary columns.
- Constant-time secret compare.
- Idempotency: a row already in `complete`/`failed` is never reverted to `running`.
- UUID-validated `run_id`; malformed bodies → 400.

**Deploy:** `BACKTEST_CALLBACK_SECRET` must exist in Lovable Cloud secrets AND on Railway
(same value) before either side is exercised.

---

## Subscription reconciliation cron lives in `cron.job`, not in a migration

**Status:** Accepted.

**Context:** The nightly `reconcile-subscriptions-nightly` job (`0 3 * * *`) is scheduled via
`cron.schedule(...)` executed through `supabase--insert`, not via a `supabase/migrations/*.sql`
file. It hits `net.http_post` against the project's own function URL with the project's anon key
and a shared secret in the headers.

**Decision:** Keep the schedule out of `supabase/migrations/`. Migrations run on every remix and
restore, and this command embeds project-specific values (URL, anon JWT, `RECONCILE_SHARED_SECRET`)
that must not leak into other users' projects. This matches Lovable's guidance for pg_cron jobs
that call project URLs.

**Consequences:**
- The schedule **will not survive a database rebuild / restore-from-backup**. After any such
  restore, re-run the same `cron.schedule('reconcile-subscriptions-nightly', ...)` block with the
  live anon key and the live `RECONCILE_SHARED_SECRET` value. Verify with
  `SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'reconcile-subscriptions-nightly';`
- The shared secret is stored **in plaintext inside `cron.job.command`** and is readable by any
  role with `SELECT` on `cron.job`. If Supabase Vault becomes available on Lovable Cloud, migrate
  the secret to Vault and have the cron command read it via `vault.secrets` instead of embedding
  the literal.
- The edge function itself enforces `x-reconcile-secret` (401 on mismatch), so a leaked URL alone
  is not enough to invoke it.

### Secret rotation runbook

The 2026-07-11 rotation temporarily created `public._reschedule_reconcile_cron(text)` — a
SECURITY DEFINER function that took the new secret as an argument and called `cron.schedule`
internally — so the new value would not appear in any tool-call payload. It was **dropped
immediately after use**.

Rationale for dropping: a SECURITY DEFINER that schedules arbitrary text as pg_cron SQL is a
privilege-escalation surface (same shape as the Jul-9 SEC-privesc fix). Rotations are rare
enough that a permanent surface is a bad trade.

**Next rotation runbook:**

1. `generate_secret` a fresh `RECONCILE_SHARED_SECRET`, then `deploy_edge_functions ["reconcile-subscriptions"]`.
2. Re-create the helper via a migration. Grant `EXECUTE` to the exec role (`sandbox_exec`) — the
   psql session runs as `sandbox_exec`, not `service_role`, so a `service_role`-only grant will
   fail. Call the helper with the new secret loaded from a shredded temp file, then
   `DROP FUNCTION public._reschedule_reconcile_cron(text);` **in the same session**. Never leave
   it in the schema between rotations — permanence is the risk, not the grant. If the session
   dies mid-way, drop the function first thing on reconnect.
3. Prove: `POST` without header → 401; with old header → 401; with new header → 200.

**Better:** move `RECONCILE_SHARED_SECRET` into Supabase Vault when it becomes available on
Lovable Cloud. The cron command can then read the value via `vault.secrets` at execution time,
which removes the plaintext from `cron.job.command` and makes this helper unnecessary
altogether.



