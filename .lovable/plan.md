## Findings (pre-plan)

- **DB failed rows:** there are currently **no `status='failed'` rows**. The 07-03 01:56 UTC pending row (`db51e68f…`) that was stuck earlier has already been cleared. So there is no `error_message` to report right now — we'll capture one on the fresh verification run below.
- **Source of run-backtest** (`supabase/functions/run-backtest/index.ts` lines 400-428): the `/run/async` body **already includes** both `callback_url: ${supabaseUrl}/functions/v1/backtest-callback` and `callback_secret: Deno.env.get("BACKTEST_CALLBACK_SECRET")`. Non-202 responses are captured into `error_message` and returned as 502. So the issue is purely that this source is not the deployed version.
- **BACKTEST_CALLBACK_SECRET:** present in Lovable Cloud → Secrets (visible in the secrets listing). No `set_secret` needed.
- **Frontend "blank screen" on non-202:** `handleRun` in `src/pages/Backtesting.tsx` already `try/catch`es and toasts; `BacktestResultsPanel` already renders `run.error_message`. The crash is almost certainly a downstream child that reads `results_detail` without a null-guard when `status='failed'`. I'll audit and guard.
- **Date-inputs / Run-button fixes** live only in preview; need `Publish`.

## Plan

### 1. Redeploy edge functions
Deploy `run-backtest` and `backtest-callback` so the live copies match the repo (callback_url/secret wiring + whitelisted callback columns).

### 2. Confirm the deployed source
Immediately after deploy, call `run-backtest` with an intentionally invalid payload to force the engine to echo back the 422 → the returned `error_message` will show whether `callback_url` reached it. Expected: no "missing callback_url" — instead an engine-side 4xx about the bad payload or a 202.

### 3. Harden the failure UI (no more blank screen)
Two small guards, both in the frontend only:

- **`src/components/backtesting/BacktestResultsPanel.tsx`** — when `run.status === 'failed'`, return the error card and short-circuit BEFORE any child that reads `results_detail` (Teach/Coach panels are already null-guarded; audit the Results body for unguarded `run.results_detail.<x>` reads and wrap in `run.results_detail ?? {}`).
- **`src/pages/Backtesting.tsx`** — wrap the panel column in an `ErrorBoundary` (new tiny component at `src/components/ErrorBoundary.tsx`) so any future render error surfaces inline instead of white-screening the route.

No engine or DB changes. No changes to `BacktestCoachPanel` / `BacktestTeachPanel` gating.

### 4. Publish the frontend
Call `preview_ui--publish` so the text-input date fields, the 10-min stale-run gating on the Run button, and the new ErrorBoundary reach `keen-chart-clone.lovable.app`.

### 5. Verify end-to-end (in-range window)
Post-publish, run a backtest with `2025-11-01 → 2025-12-31` (inside the engine's 2025-10-01 → 2026-04-09 data range) and:
- Confirm the row goes `pending → running → complete`.
- Pull `backtest-callback` logs — expect a `200`. A `401` = secret mismatch; a `500` = payload/whitelist issue.
- If it still fails, pull the newest failed row's `error_message` and report it verbatim.

## Out of scope
- Changing engine behavior on Railway.
- The Ask-the-Coach / Teach panel gating (separate thread).
- Date-picker redesign — keep the text `YYYY-MM-DD` mask as-is.

## Deliverables
- Deployed `run-backtest` + `backtest-callback` matching the repo.
- New `src/components/ErrorBoundary.tsx` and a small guard pass in `BacktestResultsPanel.tsx`.
- Published site.
- Verification run log + callback log excerpt reported back inline.