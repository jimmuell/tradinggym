## Two updates to the earlier plan

### A. The 450d → 2,191d "cliff, not curve" is the correct read

Route this straight to Claude Code in `mes-orb-strategy`:

- Failure signature is a hard cliff between ~450d and ~2,191d on 5-min data, not a slow curve. 90× more data added 0.7s on the last data point; then it hangs forever. That points at **memory / OOM**, not CPU.
- Please check Railway logs for an OOM kill around the timestamp of run `3d034e96` (2026-07-12 14:51 UTC).
- Look for anywhere the full equity curve, per-bar diagnostic frames, or intermediate arrays are held in-memory for the whole run — stream/downsample instead of accumulating.
- Caveat to share honestly: the 450d/3.5s figure is engine v22.0.0; production is now 25.18.1 with ADR-036/041 vectorization, so the cliff location may have moved. That's exactly why we need the confirmatory ~1-year run below.

### B. Default range: ~1 year, not 1 week — you are right

A 7-day default is a footgun: our own coaching cards flag ~16 trades as noise. Ship a ~1-year default (`2025-04-01 → 2026-04-01`), which the last comparable engine finished in ~3.5s and which gives hundreds of trades. Keep the 1-week Quick Test button.

## What I need from you before this ships

I can't run a backtest as your Expert user from this side (no auth session), so I can't independently time `2025-04-01 → 2026-04-01` on engine 25.18.1 before flipping the default. Two options:

1. **Preferred — you time it once after build-mode switch.** I set the default to `2025-04-01 → 2026-04-01`, you load Backtesting, click Run once on the defaults, and report the actual runtime. If it's > ~15s or hangs, we roll the default back in one line (e.g. to 6 months) and re-time.
2. **Conservative** — ship a 6-month default (`2025-10-01 → 2026-04-01`) first, and widen to 1 year after you confirm the 1-year runtime is snappy.

I'll ship option 1 unless you say otherwise in the approval — it's the target you asked for and it's trivially adjustable.

## What already shipped (previous approval)

- Migration `supabase/migrations/20260712151824_3592b5d3-b125-44c0-896e-7cddc318a80c.sql`:
  - `backtest_runs.last_progress_at timestamptz` added and backfilled from `created_at`.
  - `public.fail_stale_backtests()` rewritten to flip pending/running rows to `failed` when `coalesce(last_progress_at, created_at) < now() - interval '10 minutes'`, with the plain-English message.
  - pg_cron job `fail-stale-backtests-watchdog` scheduled `* * * * *` calling `public.fail_stale_backtests()` directly (no URL/secret — safe to migrate).
- Confirmed: `cron.job` shows `fail-stale-backtests-watchdog`, `active=true`, `schedule='* * * * *'`.

## Watchdog verification against run 3d034e96 — reality check

Run `3d034e96` **no longer exists in the DB.** Latest surviving row is `62c79e83…` at 14:23:23Z; everything after that (including the stuck 6-year run) was deleted between our last two turns, most likely by admin cleanup / the account-delete flow. So we've lost the naturally-occurring test case.

Substitute proof I will run after build-mode switch:

1. `INSERT` a synthetic `backtest_runs` row with `status='running'`, `last_progress_at = now() - interval '11 minutes'`, all other required fields set, `user_id` = your account.
2. Wait ≤ 90 s for the cron tick.
3. Report the exact moment `status` flips to `failed` and confirm the message matches. This proves the watchdog end-to-end without waiting another 20 minutes for a real hang.

I'll delete the synthetic row after the check so it doesn't clutter your run history.

## Two code edits to apply on build-mode switch

### 1. `supabase/functions/backtest-callback/index.ts` (after line 88, before `update(...)`)

Stamp the heartbeat on every accepted callback. Server-side; deliberately NOT added to `ALLOWED` so a leaked callback secret still cannot backdate it:

```ts
(update as Record<string, unknown>).last_progress_at = new Date().toISOString();
```

### 2. `src/components/backtesting/BacktestConfigPanel.tsx`

Two spots (lines 247-248 useState initializer, lines 282-283 reuse fallback):

```ts
const [startDate, setStartDate] = useState('2025-04-01');
const [endDate, setEndDate] = useState('2026-04-01');
```

and

```ts
setStartDate('2025-04-01');
setEndDate('2026-04-01');
```

Nothing else changes — realtime, request-count budget, slim list columns, `useBacktestRun` lazy fetch, >2y warning all stay.

## Verification checklist (post-switch)

- [ ] Callback edit deployed; a fresh 1-week run bumps `last_progress_at` (spot-check via SQL after the run).
- [ ] Synthetic stuck row flips to `failed` within one cron tick with the plain-English message; timestamp reported.
- [ ] `cron.job` still shows `fail-stale-backtests-watchdog` active; filename `supabase/migrations/20260712151824_3592b5d3-b125-44c0-896e-7cddc318a80c.sql`.
- [ ] Fresh page load shows defaults `2025-04-01 → 2026-04-01`. You click Run — report the actual runtime.
- [ ] >2y warning renders only when a user deliberately widens the range.
- [ ] No regression: 3 requests/run, 0 idle requests, realtime SUCCEEDED once per page load.
