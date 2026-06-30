## ADR-030 — Flat $/round-trip commission

**Pre-flight done:**
- Migration applied: `commission_mode text`, `commission_per_rt numeric` added to `backtest_runs`.
- Confirmed `commission_pct` is nullable with default `0.1` — safe to drop from new inserts.
- Engine v25.5.0 live on Railway — skipping ping.

**Deploy order:** edge function → frontend (migration already done).

### 1. Edge function (`supabase/functions/run-backtest/index.ts`)
- Accept new payload fields: `commission_mode` ("flat_per_rt"), `commission_per_rt` (number, default 1.24).
- Derive `commission_rate: 0` internally when mode is `flat_per_rt` (do not require client to send it).
- Forward `commission_mode`, `commission_per_rt`, `commission_rate` to engine on both `/run` and `/run/compare`.
- Persist `commission_mode` + `commission_per_rt` on the `backtest_runs` insert; stop writing `commission_pct` on new rows.
- Add `ENGINE_REQUEST_RISK` console log line with the three commission fields + stop/target.
- Redeploy via `supabase--deploy_edge_functions`.

### 2. Frontend
- `src/components/backtesting/BacktestConfigPanel.tsx`: replace percent commission field with **"Commission ($ per round-trip, all-in)"** numeric input, default `1.24`. Remove any legacy percent-distortion warnings. Update cockpit live cost summary so "Commission drag" = `commission_per_rt * qty`.
- `src/pages/Backtesting.tsx` (or wherever the payload is built): send `{ commission_mode: "flat_per_rt", commission_per_rt }`; stop sending `commission_pct`/`commission_rate`.
- Historical reads (run history / compare / explain panels): keep reading `commission_pct` as fallback for older rows; prefer `commission_per_rt` when present for display.

### 3. Out of scope
Slippage, validation panel, tier gating — untouched.

### 4. Verification
- Run a backtest, confirm `backtest_runs` row has `commission_mode='flat_per_rt'`, `commission_per_rt=1.24`, `commission_pct` null.
- Confirm edge function logs show `ENGINE_REQUEST_RISK` with the three fields.
- Old history rows still render (fallback to `commission_pct`).

### 5. Changelog
Append entry to `change_log/CHANGELOG_2026-06-30.md`.