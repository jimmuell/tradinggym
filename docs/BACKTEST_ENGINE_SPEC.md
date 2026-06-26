# Backtest Engine Specification

> **Ownership boundary:** The backtest engine is a separate project from this Lovable codebase. It lives in its own repository and is deployed/maintained independently. Bugs in the engine runtime (NameError, TypeError, sandbox import failures, etc.) must be fixed in the engine repository, not by repeatedly editing or redeploying the `run-backtest` edge function. This document explains the contract so that an AI agent can read it and understand where the engine ends and the web app begins.

## 1. Engine Repository & Deployment

| Property | Value |
| --- | --- |
| Repository | `github.com/jimmuell/mes-orb-strategy` |
| Runtime | FastAPI, Python 3.12 |
| Deployment | Railway |
| Deploy trigger | Auto-deploy from `main` |
| Ownership | Engine team / Claude Code in `mes-orb-strategy` |

**Important:** The web app (`src/`) and the Supabase Edge Function (`supabase/functions/run-backtest`) do not contain the engine source. They only call the engine's public HTTP endpoints. The engine URL and API key are secrets stored in environment variables and never committed to this repo.

## 2. Environment Secrets (placeholders only)

These values are configured in the Edge Function environment (e.g. Supabase secrets or Lovable Cloud secrets). They are **not** documented with real values in this spec.

| Variable | Purpose |
| --- | --- |
| `BACKTEST_ENGINE_URL` | Base URL of the deployed engine (e.g. `https://mes-orb-strategy.up.railway.app`) |
| `BACKTEST_ENGINE_API_KEY` | API key required by the engine in the `X-API-Key` header |

## 3. Engine API Shape

The engine exposes at least two endpoints:

- `POST /run` — execute a backtest
- `GET /ping` (or `GET /`) — health/liveness check

### 3.1 `POST /run` — request contract

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `signal_code` | string | Yes | Python source code that will be executed by the engine against a supplied DataFrame. Must define the boolean columns `long_entry`, `long_exit`, `short_entry`, `short_exit`. |
| `direction` | string | Yes | `