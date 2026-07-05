# TradingGYM — Backtesting Smoke & Test Plan (Hybrid)

The **manual checklist is the source of truth** for "is backtesting working." A **small set of
Playwright tests** automates only the handful of checks that (a) break silently and (b) are
tedious/exact to verify by hand. Everything else you run by eye off the list below.

This keeps cost sane: automation is paid for once (and re-paid when it breaks), so we only
automate where it clearly earns it. Manual checks cost a minute of your time and ~zero tokens.

---

## The rule (use this to decide "manual or automated?")

**Automate it** when the check is: run often · cheap to keep working · catches a regression
you'd otherwise miss (silent breakage). Good examples: "date fields still editable," "all 6
teaching cards render."

**Keep it manual** when the check is: run rarely · a visual/judgment call · costs real money
or quota to run · or lives on a screen that's still changing weekly. Good examples: "does a
real 18-year run complete," "do the numbers look sane," "does the chart look right."

When in doubt, leave it manual and add it to the checklist. Never let an automated test do
something metered (a real backtest) or flaky in a loop — that's what burned time and tokens
before.

---

## Automated (Playwright) — run anytime, ~8s, free

> **Saved replay data** = a real completed run's `results_detail`, captured from the DB (source run id
> recorded in the fixture) and replayed in tests to verify display — not fabricated data.

Location: `e2e/backtesting.spec.ts` (+ `e2e/helpers/tier.ts`). Run:

```bash
npx playwright test                    # whole suite
npx playwright test e2e/backtesting.spec.ts   # just backtesting
npx playwright test --ui               # watch it, good for spot-checking
```

Cost profile (measured): ~8s fixed login/setup + ~1.6s per test. Fully mocked — no real
backtests, no quota use, independent of the account's plan.

| # | What it guards (a silent regression from the async-backtest session) | Status |
|---|---|---|
| 1 | Date pickers render valid, populated defaults (they went blank/uneditable) | ✅ on main |
| 2 | Run button stays disabled until a strategy is selected | ✅ on main |
| 4 | A failed run shows an error, **not** a blank white screen (ErrorBoundary) | ✅ on main |
| 3 | A **no-stop** run still renders all 6 teach cards + "Ask the Coach" (mocked fixture) | ✅ on main (`0bc7c85`) |

All four silent-regression guards are now automated — including test 3, the exact bug that
hid every teaching card on no-stop runs. It's fully mocked (a completed no-stop-run fixture +
forced admin tier), so it costs no quota and no real backtest. **Everything past these four
stays manual** — that's the line: automate the silent, tedious, exact regressions; eyeball the
rest.

---

## Manual smoke checklist — run on each deploy

Tick these by eye. Most take seconds; only #4 uses a real run.

- [ ] **1. The change is actually LIVE.** After any Lovable edit, load the published URL (or
  hit the edge endpoint) and confirm the change appears. *Repo/preview ≠ live — this gap cost
  the most time last session.*
- [ ] **2. Engine is healthy.** Open the two URLs and eyeball the JSON:
  - `…/ping` → `25.15.0`, `data_path` = the Parquet
  - `…/health` → ~1,289,036 bars, `2008-01-02 → 2026-04-09`
- [ ] **3. The page loads unlocked for a paid user.** Backtesting shows the strategy picker +
  date pickers + Run button (not the "Upgrade to Pro" lock). *Note: there's a known brief flash
  of the lock on load while the tier resolves — that's the loading-race, harmless.*
- [ ] **4. One real backtest completes end-to-end.** Pick a strategy, set an **in-range** window
  (inside 2008-01-02 → 2026-04-09), Run, watch the row go `running → complete`. *This uses 1 of
  the 5 monthly runs on that account — do it sparingly, not every deploy.*
- [ ] **5. Results look sane** (judgment call): headline P&L + trade count are plausible.
  *(That the 6 cards + "Ask the Coach" actually render is now automated — here you're just
  eyeballing whether the numbers make sense, not whether the cards appear.)*
- [ ] **6. Full 18-year run** — *only when the engine or dataset changed.* Run one wide window
  (e.g. 2010 → 2025), confirm it completes (~4 min, via the async path).

### Don't-forget checks (rare, situational)
- [ ] Tier gating: a **starter** account sees the locked panel; a **pro/admin** account doesn't.
  *(Automate later only if a starter test account gets set up.)*
- [ ] Coach actually answers when you click "Ask the Coach" (real AI call — manual, judgment).

---

## What we intentionally do NOT automate (and why)

- **The real end-to-end backtest** — metered (5/month) and slow. Manual step #4 covers it.
- **The full 18-year run** — rare (only on engine/data changes) and ~4 min. Manual step #6.
- **Visual / copy / "looks right"** — judgment calls; automating them is expensive and flaky.
- **Coach AI responses** — real AI call, non-deterministic. Eyeball it.

If one of these starts breaking repeatedly, revisit — the rule at the top decides.

---

## Notes for future sessions

- **Fixture maintenance:** test 3 renders from `e2e/fixtures/no-stop-run.json`. If the engine
  ever changes its teaching-block shape, that fixture can drift — the test could pass while
  production differs, or fail spuriously. It's importable, so refresh it from a real completed
  no-stop row when the teaching structure changes. (Accepted trade-off for a deterministic,
  quota-free test.)

- A separate, **opt-in** `e2e/backtesting-smoke.spec.ts` (one real run, gated by a
  `waitForNoRunInProgress` guard) can exist for a manual "prove the whole path" run — but it is
  **not** in the default suite and is not run casually (quota).
- Housekeeping: a few leftover `pending` `backtest_runs` rows exist on `pro@gmail.com` from test
  debugging — clear them with a `DELETE` when convenient.
- Supersedes the earlier `BACKTESTING_TEST_PLAN.md` (whose starter specs are now merged code).
