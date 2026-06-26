## Backtest Engine Documentation Spec

Produce a single factual operator reference document for the backtest engine and align the `run-backtest` edge function with the documented auth contract.

### Deliverable

`docs/BACKTEST_ENGINE_SPEC.md` — one file, no real secrets, no engine source code.

### Document structure

1. **Ownership boundary (READ FIRST)** — engine is a separate repo (`github.com/jimmuell/mes-orb-strategy`, FastAPI, Python 3.12, Railway); fixes for `engine.py` / `server.py` belong there via Claude Code.
2. **Identity & deployment** — repo, stack, Python version, Railway auto-deploy, maintenance path.
3. **Environment secrets** — placeholders for `BACKTEST_ENGINE_URL` and `BACKTEST_ENGINE_API_KEY`.
4. **API contract** — `GET /ping` health check; `POST /run` request/response, including `run_validation` / `validation_iterations`, auth behavior (503/401), `x-api-key` header.
5. **Market & economics** — MES, $5/point, FirstRate 5-min bars, NET-of-commission P&L.
6. **Historical data & timezone contract** — engine loads its own bars; date/timezone normalization is the engine's responsibility.
7. **Signal code contract** — required `df` columns, allowed helpers, forbidden syntax.
8. **Known soft spots** — regime dependency, useful filters, frozen $1/point engine copy.
9. **Edge function responsibilities** — what the orchestrator does and does not do.
10. **Troubleshooting boundary** — how to route errors based on traceback path.
11. **Out of scope** — engine internals, frozen copy, UI details.

### Alignment changes

- `supabase/functions/run-backtest/index.ts` — change `X-API-Key` header to `x-api-key` and redeploy.

### Sources used to build the doc

- Operator-provided factual reference (this chat turn).
- `supabase/functions/run-backtest/index.ts`.
- `src/hooks/useBacktestRuns.ts`.
- `src/hooks/useRunBacktest.ts`.

### Non-goals

- No engine source code changes.
- No engine bug workarounds in the edge function.
- No real secrets in the document.

### Status
- Document rewritten with operator-provided facts.
- Edge function auth header aligned to `x-api-key` and redeployed.
- Build passes.
- Changelog updated.
