## Backtest Engine Documentation Spec

Produce a single self-contained markdown file that explains the backtest engine as a separate project/service, its API contract, and its integration with the web app. This document is for AI agents and future maintainers.

### Deliverable

`docs/BACKTEST_ENGINE_SPEC.md` — one file, no real secrets, no engine source code.

### Document structure

1. **Ownership boundary** — engine is a separate repo (`github.com/jimmuell/mes-orb-strategy`) deployed on Railway (FastAPI, Python 3.12, auto-deploy from main). Engine bugs are fixed in the engine repo, not in the edge function.
2. **Environment secrets** — placeholders for `BACKTEST_ENGINE_URL` and `BACKTEST_ENGINE_API_KEY`.
3. **API shape** — `POST /run` and `GET /ping`.
4. **Request/response contract** — all fields including `run_validation` and `validation_iterations`.
5. **Signal code contract** — required `df` columns, allowed helpers, forbidden syntax, timezone rules.
6. **Market spec** — MES, $5/point, ES/MES bars.
7. **Data loading** — 18yr FirstRate 5-min bars, UTC-aware index, date bounds must be normalized.
8. **Orchestration flow** — how the edge function coordinates database → Claude → engine → database.
9. **Troubleshooting boundary** — which errors belong to the engine vs the edge function.
10. **Out of scope** — internal engine implementation, UI details.

### Sources used to build the doc

- `supabase/functions/run-backtest/index.ts`
- `src/hooks/useBacktestRuns.ts`
- `src/hooks/useRunBacktest.ts`
- Chat history about engine ownership, deployment, and data source.

### Non-goals for this task

- No engine source code changes.
- No edge function redeploys.
- No real secrets in the document.

### Status
- Document created.
- Build error from `useBacktestRuns.ts` casts fixed.
- Changelog updated.
