# Plan: Backtest engine + recent frontend changelog doc

## Deliverable
One markdown file at `/mnt/documents/BACKTEST_AND_FRONTEND_CHANGELOG.md`, with two sections, one line per item, dated.

## Sources (all three)
1. **`change_log/*.md`** — primary source of truth for dated entries.
2. **`git log`** — sweep commits touching:
   - Backtest engine surface: `supabase/functions/run-backtest/**`, `supabase/functions/backtest-callback/**`, `docs/BACKTEST_ENGINE_SPEC.md`, `src/hooks/useBacktestRuns.ts`, `src/hooks/useRunBacktest.ts` — full history.
   - Frontend: any `src/**` change from `2026-06-26` through today (`2026-07-03`).
3. **`docs/DECISIONS.md` + `docs/BACKTEST_ENGINE_SPEC.md`** — cross-reference to fill undocumented engine milestones (ADRs, contract changes).

Dedupe by (date, one-line description). Prefer changelog wording; fall back to commit subject; annotate `(ADR-###)` when an ADR exists.

## Document structure

```
# TradingGYM — Backtest engine & recent frontend changes
_Generated YYYY-MM-DD_

## Backtest engine (all time)
- YYYY-MM-DD — <one-line item> [source: changelog | git | ADR-###]
- ...

## Frontend (2026-06-26 → 2026-07-03)
- YYYY-MM-DD — <one-line item> [source: ...]
- ...

## Sources scanned
- change_log/CHANGELOG_2026-05-07_to_2026-05-08.md
- change_log/CHANGELOG_2026-05-08.md
- change_log/CHANGELOG_2026-06-26.md
- change_log/CHANGELOG_2026-06-30.md
- git log (path-filtered, see above)
- docs/DECISIONS.md, docs/BACKTEST_ENGINE_SPEC.md
```

## Steps
1. Read all four changelogs + `docs/DECISIONS.md` + `docs/BACKTEST_ENGINE_SPEC.md` in parallel.
2. Run two `git log` sweeps (engine paths, all time; `src/**` since 2026-06-26) into `/tmp`.
3. Merge → dedupe → sort ascending by date.
4. Write the markdown to `/mnt/documents/` and emit a `<presentation-artifact>` tag.

## Out of scope
- No code changes. Read-only doc generation.
- No engine-repo (`mes-orb-strategy`) history — this repo only. I'll note that limitation in the doc.
