# TradingGYM — Backtest engine & recent frontend changes
_Generated 2026-07-03. One line per item._

Sources: `change_log/*.md`, `git log` (path-filtered), `docs/DECISIONS.md`, `docs/BACKTEST_ENGINE_SPEC.md`.
Note: this covers the **tradinggym** repo only. Engine-internal work in `mes-orb-strategy` (ADRs referenced there, e.g. tz-bounds PR #8, PR #10 exit reasons) is not enumerated here.

---

## Backtest engine — all items (this repo)

- **2026-06-26** — Created `docs/BACKTEST_ENGINE_SPEC.md` documenting the engine as a separate Railway/FastAPI service with `/run` + `/ping` contracts, auth (503/401), signal contract, market spec, and orchestration flow. _[changelog]_
- **2026-06-26** — Edge function: added `toEngineUtcDateBound()` to send `start_date`/`end_date` as tz-aware UTC bounds, fixing pandas tz-naive vs tz-aware comparison error. _[changelog]_
- **2026-06-26** — Edge function: switched engine auth header from `X-API-Key` → `x-api-key` to match engine spec. _[changelog]_
- **2026-06-26** — Fixed TS cast in `useBacktestRuns.ts` (`as unknown as BacktestRun[]`) for Supabase `Json` type on `equity_curve`. _[changelog]_
- **2026-06-26** — PR #1: surface engine validation verdict in backtest results panel. _[git]_
- **2026-06-26** — PR #2: persist validation budget end-to-end (DB column + edge function). _[git]_
- **2026-06-26** — PR #3: hotfix — replace retired Claude model id (backtest 404). _[git]_
- **2026-06-26** — PR #4: **ADR — no committed engine key**; removed hardcoded `BACKTEST_ENGINE_API_KEY` fallback, now required from env. _[git / DECISIONS.md]_
- **2026-06-26** — PR #5: three precision fixes to `BACKTEST_ENGINE_SPEC.md`. _[git]_
- **2026-06-26** — PR #6: expose validation budget (`run_validation`, `validation_iterations`) in config panel and thread it to the engine. _[git]_
- **2026-06-26** — Status entry: validation pipeline live end-to-end (tradinggym → run-backtest → engine → KPIs + honest verdict → persisted). _[DECISIONS.md]_
- **2026-06-27** — PR #7: expose engine execution params (`stop_loss_pct`, `take_profit_pct`, `qty_value`) end-to-end. _[git]_
- **2026-06-27** — PR #8: add deploy-probe log line to `run-backtest` (diagnostic). _[git]_
- **2026-06-27** — Log exact risk params sent to engine (`ENGINE_REQUEST_RISK` diagnostic line). _[git]_
- **2026-06-27** — PR #9 (BT-DET-1): signal determinism via `signal_cache` (hash strategy config + timeframe; reuse cached `ai_signal_code`). _[git / DECISIONS.md]_
- **2026-06-27** — PR #11 (BT-DET-2): admin-only "force-regenerate signal" toggle to bypass cache. _[git]_
- **2026-06-27** — PR #13 (BT-CMP-0): persist `signal_hash` on `backtest_runs` for compare-aware runs. _[git]_
- **2026-06-27** — PR #14 (STEP-4b): compare backtest runs (signal-aware, with charts). _[git]_
- **2026-06-27** — Status entry: signal determinism live end-to-end. _[DECISIONS.md]_
- **2026-06-30** — **ADR-030**: flat $/round-trip commission model (default $1.24) — new `commission_mode` + `commission_per_rt` columns; edge function forwards to engine on `/run` and `/run/compare`; legacy `commission_pct` still read. _[changelog / DECISIONS.md]_
- **2026-07-02** — Edge function change (engine surface). _[git — "Changes"]_
- **2026-07-03** — Hardened AI signal-code generator systemPrompt: added `calc_smma`, mandated vectorized helpers, banned per-bar Python loops / per-row `.apply` over the ~1.3M-row series; deployed `run-backtest`. _[chat]_
- **2026-07-03** — **ADR-040**: engine writes results via new `backtest-callback` edge function (X-Callback-Secret) instead of direct DB writes; `run-backtest` now targets `/run/async` and passes callback URL + secret. _[DECISIONS.md]_
- **2026-07-03** — Removed admin-only "Force-regenerate signal" UI wiring from `useRunBacktest.ts` (edge function still accepts `force_regenerate` server-side). _[chat]_

---

## Frontend — last 7 days (2026-06-26 → 2026-07-03)

- **2026-06-26** — PR #6: added validation-budget controls (`Run validation`, `Iterations`) to `BacktestConfigPanel`. _[git]_
- **2026-06-26** — Surface engine validation verdict in `BacktestResultsPanel` (PR #1). _[git]_
- **2026-06-27** — PR #12 (STEP-4a): backtest explainability panel (`BacktestExplainPanel`). _[git]_
- **2026-06-27** — PR #14 (STEP-4b): compare-runs panel (`BacktestComparePanel`) with signal-aware charts. _[git]_
- **2026-06-27** — PR #15 (STEP-4c): parameter sweep / optimize panel (`BacktestOptimizePanel`, client loop). _[git]_
- **2026-06-27** — PR #11: admin "Force-regenerate signal" toggle in config panel. _[git]_
- **2026-06-28** — Frontend polish + related fixes (multiple `src/**` commits, unlabeled "Changes"). _[git]_
- **2026-06-29** — Frontend polish + related fixes (multiple `src/**` commits, unlabeled "Changes"). _[git]_
- **2026-06-30** — ADR-030 frontend: commission field relabeled "Commission ($ per round-trip, all-in)", default `1.24`; cockpit cost summary now uses `commission_per_rt × qty × trades`; `Backtesting.tsx` sends `commission_mode: 'flat_per_rt'`; reuse-last-run hydrates from `commission_per_rt`. _[changelog]_
- **2026-06-30** — Backtest cockpit responsive layout: `grid-cols-[repeat(auto-fit,minmax(280px,1fr))]` at section level, `minmax(130px,1fr)` for paired fields; parent grid loosened to `lg:grid-cols-[minmax(380px,480px)_1fr]`. _[changelog]_
- **2026-07-01** — PR #18: e2e smoke test for commission teaching card + `commission-input` id added. _[git]_
- **2026-07-01** — Frontend polish + related fixes (multiple `src/**` commits, unlabeled "Changes"). _[git]_
- **2026-07-02** — Frontend polish + related fixes (multiple `src/**` commits, unlabeled "Changes"). _[git]_
- **2026-07-03** — Starter-lock flash fix on Backtesting page: `BacktestConfigPanel` shows loading state until `TierContext` resolves, so pro users never briefly see the "Upgrade to Pro" lock. _[chat]_
- **2026-07-03** — Removed admin-only "Force-regenerate signal" toggle from `BacktestConfigPanel`, `Backtesting.tsx`, and `useRunBacktest.ts` (zero `forceRegenerate` / `force_regenerate` refs remain in frontend). _[chat]_

---

## Sources scanned
- `change_log/CHANGELOG_2026-05-07_to_2026-05-08.md` (pre-backtest era, not included)
- `change_log/CHANGELOG_2026-05-08.md` (pre-backtest era, not included)
- `change_log/CHANGELOG_2026-06-26.md`
- `change_log/CHANGELOG_2026-06-30.md`
- `git log` on `supabase/functions/run-backtest/*`, `supabase/functions/backtest-callback/*`, `docs/BACKTEST_ENGINE_SPEC.md`, `src/hooks/useBacktestRuns.ts`, `src/hooks/useRunBacktest.ts` (all time)
- `git log` on `src/*` since 2026-06-26
- `docs/DECISIONS.md`, `docs/BACKTEST_ENGINE_SPEC.md`

### Caveats
- Many commits between 2026-06-28 and 2026-07-03 have the generic subject "Changes" — those days are rolled up as single frontend lines. If you want them broken out, I can diff each commit and expand.
- Engine-repo (`mes-orb-strategy`) history is not included; only its impact on this repo (edge function, docs, DB shape) is.
