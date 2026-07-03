# TradingGYM — Recent Features Overview (onboarding)

**Purpose:** get a coworker up to sync on everything shipped in the **last ~10 days
(2026-06-23 → 2026-07-03)**. Nearly all of it is one arc: **building out the Backtesting
system** — from an honest validation verdict, through signal determinism, compare/optimize,
the six teaching cards + AI coach, realistic risk/cost params, and an async engine — plus the
UX and test-suite work around it.

**How this doc relates to the others** (read these for depth; this is the map):
- `docs/BACKTEST_AND_FRONTEND_CHANGELOG.md` — granular, one-line-per-change log (the "what changed when").
- `docs/DECISIONS.md` — the architecture decision records (the "why"), incl. ADR-030/040.
- `docs/BACKTEST_ENGINE_SPEC.md` — the engine contract, ownership boundary, market/econ spec.
- `docs/SOURCE_OF_TRUTH.md` — which of the 3 code surfaces owns which question.
- `docs/DEPLOY_WORKFLOW.md` — how changes actually reach production (read this — see "Deploy reality").
- `docs/BACKTESTING_SMOKE_PLAN.md` — manual + automated test plan for "is backtesting working."

---

## 0. The mental model (read this first)

There are **three code surfaces**, owned/deployed differently:

1. **App (this repo, `jimmuell/tradinggym`)** — React/Vite frontend + Supabase Edge Functions,
   built in **Lovable**. This is what you edit here.
2. **Edge function `run-backtest`** (`supabase/functions/run-backtest/`) — the **orchestrator/caller**.
   It reads the run row, asks Claude to generate signal code, calls the engine, and (now) hands off
   to an async callback. Lovable-managed.
3. **Backtest engine** — a **separate repo** `jimmuell/mes-orb-strategy` (FastAPI on Railway).
   The app **cannot** edit it. Engine bugs are fixed there via its own Claude Code checkout. See the
   ownership boundary at the top of `BACKTEST_ENGINE_SPEC.md`.

**Deploy reality (the #1 gotcha):** "merged to main" ≠ "live." Lovable does **not** auto-apply
DB migrations or auto-redeploy edge functions on merge, and the engine auto-deploys from *its*
`main` on Railway. Always verify at the live runtime (edge-function logs, engine `/ping` + `/health`),
not the GitHub commit. This gap cost the most time; `DEPLOY_WORKFLOW.md` covers the steps.

**End-to-end flow (current, async):**
```
User → BacktestConfigPanel → insert backtest_runs row (pending)
     → run-backtest edge fn → Claude generates signal code → engine POST /run/async (+ callback URL/secret)
     → engine runs, then calls backtest-callback edge fn (X-Callback-Secret) → writes results to the row
     → UI polls the row → Results + Teaching cards + Coach render on completion
```

---

## 1. Honest validation verdict

**What:** every completed backtest gets a structured "is this edge real?" verdict (overall
status + summary + findings + regime breakdown), rendered in the results panel. A passing result
is deliberately labeled **"Promising," never "PASS"** — the tool must not overclaim.
**Why:** a backtest that just prints P&L overstates edge; the verdict runs a Monte-Carlo /
stability validation layer and surfaces the honest read (including multiple-testing caveats).
**How/where:** engine emits `validation` / `validation_error`; `run-backtest` persists them;
`BacktestVerdictPanel` renders them. Budget is user-controllable via **Run validation** + a
100–20000 **Iterations** control that threads to the engine.
**Status:** live. (PRs #1, #2, #6.)

## 2. Signal determinism — content-addressed `signal_cache`

**What:** the same strategy + timeframe now produces the **same** generated signal code across
runs, instead of re-asking Claude every time (which gave 15/293/519 trades for identical inputs).
**Why:** you can't A/B a stop or compare/optimize if the underlying trades change under you.
**How:** the AI signal code is cached in a `signal_cache` table keyed by a **content hash** of only
the inputs that determine the signal (scheme version + model + system-prompt fingerprint + timeframe +
canonicalized strategy config). Risk/date/qty params are **excluded** from the hash (they're applied
downstream), so a stop sweep reuses one cached signal. `signal_hash` is also persisted on each run.
**Status:** live (BT-DET-1, PR #9; hash on runs BT-CMP-0, PR #13). See `DECISIONS.md`.
**Note:** an admin "force-regenerate" bypass existed and its **UI was later removed** (the edge
function still accepts `force_regenerate` server-side).

## 3. Compare & Optimize

- **Compare (STEP-4b, PR #14):** `BacktestComparePanel` — pick 2–3 completed runs and see them
  side-by-side with a **same-signal banner** (via `signal_hash`), diff of what changed, best-in-row
  KPI table, overlaid equity curves, P&L bars, and verdict chips. Honest because it only attributes
  differences to parameters when the signal is identical.
- **Optimize (STEP-4c, PR #15):** `BacktestOptimizePanel` — an Expert/Guru/admin-only single-parameter
  **sweep** (stop / take-profit / qty). Runs are fired **sequentially** so the first warms the signal
  cache and the rest reuse one signal, then ranks the outcomes with a response curve.

## 4. Explainability — the six teaching cards + "Ask the Coach"

**What:** after a run, a **TEACH-COMPARE** panel renders **six per-dimension cards** — each answers
"what did this choice actually do?": **stop, take-profit, commission, direction, slippage,
position size**. Titles are exact (`"What your stop did"`, `"What commission cost you"`, etc.).
Alongside is **"Ask the Coach"** — an AI chat (Claude) that explains the result in plain language.
**Why:** turn raw KPIs into teaching. Notable regression fixed: a **no-stop run** used to hide
**every** teaching card (a `hasStopConfig` gate); now all six render regardless of stop.
**How/where:** engine emits `_teaching` (+ `_same_signal`) in `results_detail`; `BacktestTeachPanel`
renders the six `*CardBody` components (`titleFor`), with a "couldn't produce a reliable comparison"
fallback when `_same_signal` isn't true. `BacktestCoachPanel` / `CoachChat` wire Claude in with
rendered markdown; the coach is tier-gated and the chat is server-rate-limited.
**Status:** live. Guarded by an e2e test (see §8).

## 5. Risk & execution parameters (realistic costs)

The config panel now exposes real execution inputs, all threaded through the edge function to the engine:
- **Point/tick stops & targets** — `stop_loss_points` / `take_profit_points` (ADR-023), a **% OR points**
  toggle (mutually exclusive; engine precedence points > pct). MES economics helper `src/lib/mesContract.ts`
  gives live per-contract readouts (pts×4 = ticks, pts×$5 = $/contract).
- **Slippage** — `slippage_ticks`, adverse on every fill (ADR-024).
- **Flat commission** — **$/round-trip** model, default **$1.24** all-in (ADR-030): new `commission_mode`
  + `commission_per_rt` columns; the "Commission ($ per round-trip, all-in)" field replaces the old %.
**Status:** live end-to-end. Migrations add the columns; `run-backtest` forwards them and logs
`ENGINE_REQUEST_RISK` for observability.

## 6. Engine changes (separate `mes-orb-strategy` repo — impact on us)

You don't edit the engine, but these landed and matter:
- **ADR-023** — constant point-denominated stops/targets.
- **ADR-024** — adverse slippage model (`slippage_ticks × tick_size` per fill).
- **ADR-025** — **protective stop is live from the entry bar** (`i >= entry_bar_idx`); previously the
  stop was skipped on the entry bar so tight stops didn't cap losses. `slippage_ticks=0` etc. keep runs
  byte-identical.
- **ADR-031** — hotfix: cast `flips_profitability` to a native `bool` (a `numpy.bool_` was 500-ing the
  whole `/run/compare` response).
- **ADR-040** — **async results:** the engine now writes results via a new **`backtest-callback`** edge
  function (authenticated by `X-Callback-Secret`) instead of direct DB writes; `run-backtest` calls
  `/run/async` with a callback URL + secret. This is why the run flow is async now.
- Engine version moves fast — check the live version at the engine's **`/ping`** (and `/health` for the
  ~1.29M-bar dataset, `2008-01-02 → 2026-04-09`). Don't hardcode a version in code.

## 7. Frontend / UX polish

- **Tier-adaptive "cockpit" layout** for the config panel (admin/guru get a denser cockpit; responsive
  auto-fit grids).
- **Date pickers** replaced the old date fields (calendar `DatePickerField`, ids `#bt-start-date` /
  `#bt-end-date`), with in-range date validation (engine data bounds).
- **Starter-lock flash fix (`81a8956`):** `BacktestConfigPanel` now shows a **"Loading your plan…"**
  state until `TierContext` resolves, so a paid user never briefly sees the "Upgrade to Pro" lock
  (TierContext defaults to `starter`/`loading:true` then fetches the real plan).
- **Reuse-last-run** hydration, per-row delete in run history, verdict-phrase styling, and the
  **removal of the admin force-regenerate UI**.
- Backtests are now routed through the **async** path end-to-end (matches ADR-040).

## 8. Testing, tooling & docs

- **Deterministic e2e suite** (`e2e/backtesting.spec.ts` + `e2e/helpers/tier.ts`): fully **mocked,
  quota-free** guards for the silent regressions — date pickers populate, Run gating, failed-run
  error boundary (not a blank screen), and the **no-stop → all 6 teach cards + Ask the Coach**
  (mocked completed-run fixture `e2e/fixtures/no-stop-run.json` + forced-admin tier). ~8s + ~1.6s/test.
- **Tier-loading-flash guard** (`e2e/tier-loading-flash.spec.ts`): delays the tier fetch ~800ms to
  prove the lock never flashes for a paid user (and the unlocked panel never flashes for a starter).
- **Test philosophy** — `docs/BACKTESTING_SMOKE_PLAN.md`: automate only silent/tedious/exact
  regressions; keep real backtests, 18-year runs, and "looks right" **manual** (a real run is metered
  at **5/month** on the shared account — never automate that in a loop).
- New process docs: `docs/PROMPT_STANDARD.md`, `docs/DEPLOY_WORKFLOW.md`, `docs/SOURCE_OF_TRUTH.md`,
  `docs/BACKTEST_AND_FRONTEND_CHANGELOG.md`.

---

## Gotchas a new contributor must internalize

1. **Merged ≠ live.** Apply migrations + redeploy edge functions manually; the engine deploys from
   *its own* repo on Railway. Verify at the runtime, not GitHub. (`DEPLOY_WORKFLOW.md`.)
2. **Two repos.** App = `tradinggym` (Lovable). Engine = `mes-orb-strategy` (Claude Code + Railway).
   Read a traceback's file path to know which repo owns a bug (`index.ts` = us; `engine.py`/`server.py`
   = engine).
3. **Don't run real backtests in automated tests.** 5 runs/month on the shared account; the e2e suite is
   fully mocked on purpose.
4. **Signal cache is content-addressed.** If you change the system prompt or the canonicalization, bump
   the scheme version, or old cached signals silently persist. The e2e teaching fixture can drift from
   the engine's real `_teaching` shape — refresh it from a real completed no-stop row when the engine
   changes.
5. **`TierContext` starts as `starter`/loading.** Any panel that gates on plan must wait for `loading`
   to resolve (the Starter-lock flash is exactly this bug).

---

_Snapshot generated 2026-07-03. For anything more granular, `docs/BACKTEST_AND_FRONTEND_CHANGELOG.md`
has the per-commit log; `docs/DECISIONS.md` has the full ADR text._
