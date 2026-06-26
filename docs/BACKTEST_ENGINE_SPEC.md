# Backtest Engine Reference

> **Ownership boundary (READ FIRST):** The backtest engine is a separate system in a separate repository that Lovable cannot edit.
>
> Lovable owns: the tradinggym app, including the `run-backtest` edge function (`supabase/functions/run-backtest/index.ts`). This is the **CALLER**. Lovable can and should edit this.
>
> Lovable does **NOT** own: the engine itself (`mes-orb-strategy`, FastAPI on Railway). Engine code, including its backtest math, data loading, and date/timezone handling, lives there.
>
> Therefore: if a backtest fails with an error whose traceback points at `engine/engine.py`, `server.py`, or anything under `/app/...` on the engine, that is an **engine bug** and is fixed in the `mes-orb-strategy` repo via Claude Code — **NOT** by editing the edge function. Patching the edge function to work around an engine bug does not work, because the edge function cannot change how the engine parses inputs or runs its loop. (This happened: an engine-side timezone bug was patched twice in the edge function before the real fix went into the engine.)
>
> When in doubt about where a failure lives: read the traceback's file path. `index.ts` = edge function (Lovable). `engine.py` / `server.py` = engine (`mes-orb-strategy` / Claude Code).

## 1. Identity & Deployment

| Property | Value |
| --- | --- |
| Repository | `github.com/jimmuell/mes-orb-strategy` |
| Stack | FastAPI, pandas/numpy |
| Python | 3.12 (pinned in `api/.python-version`) |
| Hosting | Railway service `mes-orb-strategy` |
| Deploy trigger | Auto-deploys from `main` on push |
| Maintenance | Claude Code in the `mes-orb-strategy` repo (MacBook Air) |

The web app (`src/`) and the Supabase Edge Function (`supabase/functions/run-backtest`) do not contain the engine source. They only call the engine's public HTTP endpoints.

## 2. Environment Secrets

The engine URL and API key are stored as Edge Function secrets. They are **never** committed to this repo or written into documents.

| Secret | Purpose |
| --- | --- |
| `BACKTEST_ENGINE_URL` | Base URL of the deployed engine. |
| `BACKTEST_ENGINE_API_KEY` | API key required by the engine. Sent as the `x-api-key` header. |

Engine auth behavior: the engine returns **503** if the key is unset on its side, and **401** if the key is wrong.

## 3. API Contract

### 3.1 `GET /ping`

Health check. Use this (not `/run`) for "is the engine up" checks. A scripted health check should be run by Claude Code from inside the `mes-orb-strategy` repo, reading the URL/key from the machine's own environment — the secret should never travel through chat or a browser tool.

### 3.2 `POST /run`

The main endpoint. The edge function calls this with the strategy's signal code and backtest configuration.

#### Request fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `signal_code` | string | Yes | Python source code to execute. Must define the boolean columns `long_entry`, `long_exit`, `short_entry`, `short_exit`. |
| `direction` | string | Yes | `"long"`, `"short"`, or `"long_short"`. |
| `initial_capital` | number | Yes | Starting equity in USD. |
| `commission_pct` | number | Yes | Commission as a percentage (e.g. `0.1`). |
| `start_date` | string | Yes | Start date bound for the backtest. |
| `end_date` | string | Yes | End date bound for the backtest. |
| `stop_loss_pct` | number | Yes | Stop loss percentage. Pass `0` if signal logic handles exits. |
| `take_profit_pct` | number | Yes | Take profit percentage. Pass `0` if signal logic handles exits. |
| `qty_type` | string | Yes | `"fixed"` or `"percent"`. |
| `qty_value` | number | Yes | Number of contracts when `qty_type` is `"fixed"`. |
| `run_validation` | boolean | Optional | Whether to run the statistical validation layer. Default `true`. |
| `validation_iterations` | number | Optional | Validation budget. Default `2000`, accepted range `100–20000`. |

#### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | `"error"` on failure (the edge function branches only on `status === "error"`). The exact success value is unverified — the caller treats any non-`"error"` response as success and reads `kpis`. |
| `error` | string | Engine error message (often a Python traceback) when `status` is `"error"`. |
| `engine_version` | string | Engine build identifier. |
| `execution_time_ms` | number | Total wall time. |
| `kpis` | object | KPIs including net P&L, total trades, win rate, profit factor, max drawdown, avg winner/loser. Dollar KPIs are true MES dollars at `$5/point`. |
| `equity_curve` | array | `{ date, equity }` points for charting. |
| `validation` | object | Structured verdict: `{ overall, summary, findings[], regimes, skipped }`. A passing result is labeled **"Promising"**, never "PASS". |
| `validation_error` | string | Populated (instead of `validation`) if the validation layer threw. The engine surfaces validation errors rather than swallowing them. The core backtest still returns even if validation fails. |

Validation runs synchronously inside `/run`, adding roughly `~2.5s` fixed cost plus iteration cost (≈2.8s at 500 iters, 3.2s at 2000, 6.1s at 10000). A long date range plus a high iteration budget means a longer single request — relevant to any edge-function timeout limits.

## 4. Market & Economics

| Property | Value |
| --- | --- |
| Instrument | MES (Micro E-mini S&P 500) |
| Point value | `$5/point` |
| Data source | ES/MES futures bars, ~18 years, 5-minute resolution, from FirstRateData |
| Commission | Trade P&L is **NET** of commission |

Dollar KPIs are real MES dollars. The engine's `MES_POINT_VALUE` and the validation instrument's `point_value` must always agree (both `5.0`).

## 5. Historical Data & Timezone Contract

The engine loads its own historical bars; the caller does not supply 18 years of bars.

In production, the bar index is timezone-aware (UTC).

Date bounds matter: the backtest's `start_date` / `end_date` must be normalized to the bar index's timezone before they're compared against bar timestamps. Mixing a tz-naive bound with a tz-aware bar index raises `TypeError: Cannot compare tz-naive and tz-aware timestamps`. This normalization is the **engine's responsibility** (it parses the bounds and runs the comparisons); the edge function cannot fix a tz mismatch that happens inside the engine.

A local/bundled CSV path may use a tz-naive index, so the correct engine behavior is to match the bounds to whatever the index's timezone is, not to hardcode UTC.

## 6. Signal Code Contract

The engine provides a pandas DataFrame named `df` with columns `Open`, `High`, `Low`, `Close`, `Volume`, and a timezone-aware `DatetimeIndex`.

After execution, the script must leave these columns on `df`:

| Column | Type | Meaning |
| --- | --- | --- |
| `long_entry` | bool | Enter long at this bar. |
| `long_exit` | bool | Exit long at this bar. |
| `short_entry` | bool | Enter short at this bar. |
| `short_exit` | bool | Exit short at this bar. |

Available helpers: `pd`, `np`, `calc_ema`, `calc_sma`, `calc_rsi`, `calc_atr`, `calc_macd`, `calc_obv`, `calc_wma`, `calc_hma`, `calc_highest`, `calc_lowest`, `calc_donchian`, `calc_ichimoku`, `detect_crossover`, `detect_crossunder`, `get_source`.

Forbidden syntax: `import` statements, `from ... import`, `pytz`, `datetime`, `timezone`, `os`, `sys`, `subprocess`, `exec`, `eval`, `__import__`, `open()`.

## 7. Known Soft Spots / Context

- The engine is regime-dependent — stronger in trending markets, weaker in bear conditions.
- VWAP and EMA-9 filters added no selectivity on ES; the useful filters were an ORB range filter and a 200-day SMA regime filter.
- There is a second, **frozen** engine copy (`backtest/engine/engine.py`) intentionally kept at the old `$1/point` economics to preserve documented historical run figures. It is **NOT** the production engine and should not be edited as part of normal work.

## 8. Web App Orchestration Flow

The web app uses a Supabase Edge Function (`supabase/functions/run-backtest/index.ts`) as a thin orchestrator. It does not run the backtest itself; it coordinates the database, the AI signal generator, and the engine.

```text
Web App  ──▶  run-backtest Edge Function  ──▶  Database (backtest_runs)
                  │
                  ├──▶  Claude API  (signal code)
                  │
                  └──▶  Engine  POST /run
                  │
                  └──▶  Database (persist results)
```

### 8.1 Edge function responsibilities

1. Read the pending `backtest_runs` row.
2. Set `status='running'`.
3. Call Claude to generate signal code.
4. Strip markdown fences and any `import`/`from` lines.
5. Send `POST /run` to the engine with `signal_code`, config, and `x-api-key` header.
6. Pass through `run_validation` / `validation_iterations` if provided; default to `true` / `2000`.
7. Write the engine's response onto the `backtest_runs` row — including `validation`, `validation_error`, `run_validation`, `validation_iterations`, `ai_signal_code`, `engine_version`, and `execution_time_ms`.

Note: the `backtest_runs` row's `status` column (`pending` → `running` → `complete` / `failed`) is the edge function's own lifecycle field, distinct from the engine response's `status` field in §3.2.

### 8.2 Current edge function payload

The current edge function sends the request as a flat JSON object containing:

- `signal_code`
- `direction`
- `initial_capital`
- `commission_pct`
- `start_date` / `end_date`
- `stop_loss_pct` / `take_profit_pct`
- `qty_type` / `qty_value`
- `run_validation`
- `validation_iterations`

The engine loads its own bars based on the date range and instrument; the caller does not include a `bars` array.

## 9. Troubleshooting Boundary

| Symptom | Where to fix |
| --- | --- |
| Traceback in `engine.py` / `server.py` | Engine repo (`mes-orb-strategy`) via Claude Code. |
| Traceback in `index.ts` | Edge function in this repo. |
| `401` / `503` from engine | Auth/key problem. Check `BACKTEST_ENGINE_API_KEY` secret. |
| `Disallowed syntax: Import` | Generated signal code still contains an import. Edge function should strip it; engine is the authoritative enforcer. |
| Validation fails or returns `validation_error` | Engine validation layer. If the core backtest KPIs look good, the validation logic may be rejecting it. |
| Slow /run response | Combination of date range and `validation_iterations`. Reduce either. |
| `TypeError: Cannot compare tz-naive and tz-aware timestamps` | Engine-side date/timezone handling. Edge function cannot fix this. |

## 10. Out of Scope

- Internal engine implementation (P&L math, slippage model, execution loop, validation algorithms).
- The `mes-orb-strategy` repository layout or CI/CD.
- Exact response schemas for non-`/run` endpoints other than `/ping`.
- UI/UX details of the Backtesting page (those live in the app codebase).
- The frozen `$1/point` historical engine copy.

## 11. Standalone App Notes

If an AI agent needs to recreate the backtesting flow in a standalone app, the agent should implement:

1. A `backtest_runs` table matching the contract above.
2. A thin orchestrator (edge function or serverless function) that reads the run, calls an LLM for signal code, and calls the engine `POST /run` endpoint.
3. The web UI that creates runs, polls for status, and displays KPIs and equity curves.
4. Environment variables for `BACKTEST_ENGINE_URL` and `BACKTEST_ENGINE_API_KEY`.

The engine itself should remain an external service; do not reimplement the engine inside the standalone app unless the engine repo is also included.
