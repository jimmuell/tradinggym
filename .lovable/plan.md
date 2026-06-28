## Commission audit findings

I traced `commission_pct` from the UI → DB row → edge function → engine `/run` payload.

### Flow (correct parts)

1. `BacktestConfigPanel.tsx` — user-controlled input, default `0.1`, passed up as `config.commissionPct`.
2. `Backtesting.tsx` (line 47) — forwards `commission_pct: config.commissionPct` into the `backtest_runs` insert.
3. `useRunBacktest` / `useBacktestRuns` — types the field as `number | null`, persists to DB.
4. `run-backtest/index.ts` (line 376) — forwards to engine as `commission_pct`.
5. Engine applies commission server-side (per `docs/BACKTEST_ENGINE_SPEC.md` §4 — "Trade P&L is NET of commission").

### Bug found

`supabase/functions/run-backtest/index.ts` line 376:

```ts
commission_pct: run.commission_pct || 0.1,
```

This uses the `||` falsy fallback, so a user who deliberately sets commission to **`0`** (e.g. to measure gross vs net, or to A/B fee drag) gets silently overridden to **`0.1`**. The DB row says `0`, the engine receives `0.1`, and KPIs reflect commission the user didn't ask for.

`BacktestOptimizePanel.tsx` line 131 has the same pattern with `??` instead, which is correct (`0` is preserved). The edge function is the inconsistent one.

### Secondary observations (not bugs, FYI)

- The UI label is just `Commission %` with no unit hint. Per the engine contract this is a percent like `0.1` (= 0.1%), not a per-side dollar fee. Users who type `2.50` thinking "dollars per contract" would be sending 2.5% commission to the engine. Worth a tooltip later, not part of this fix.
- There is no client-side validation that `commissionPct >= 0`. Engine likely tolerates it but a negative value would inflate P&L.

### Proposed fix (one line)

Change line 376 of `supabase/functions/run-backtest/index.ts` from:

```ts
commission_pct: run.commission_pct || 0.1,
```

to:

```ts
commission_pct: run.commission_pct ?? 0.1,
```

Then redeploy `run-backtest` (per `docs/DEPLOY_WORKFLOW.md`, edge functions don't auto-deploy from VS Code; this edit goes through Lovable so it will deploy automatically on apply).

### Verification

1. Create a run with Commission % = `0`, confirm `ENGINE_REQUEST_RISK`-style log (or add `commission_pct` to the existing log line) shows `0`.
2. Compare KPIs vs a run with `0.1` — `total_commission` in KPIs should be `0` vs non-zero, otherwise identical signal/trades.

### Scope

One-line code change in `supabase/functions/run-backtest/index.ts`. No DB migration, no UI change, no engine change.