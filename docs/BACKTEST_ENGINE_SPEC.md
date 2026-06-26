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
| `direction` | string | Yes | `"long"`, `"short"`, or `"long_short"`. Determines which sides are allowed. |
| `initial_capital` | number | Yes | Starting equity in USD. |
| `commission_pct` | number | Yes | Commission expressed as a percentage (e.g. `0.1` for 0.1%). |
| `start_date` | string | Yes | ISO 8601 UTC timestamp (e.g. `2025-01-06T00:00:00Z`). Must be tz-aware. |
| `end_date` | string | Yes | ISO 8601 UTC timestamp (e.g. `2025-01-10T23:59:59Z`). Must be tz-aware. |
| `stop_loss_pct` | number | Yes | Stop loss expressed as a percentage. Engine applies it in ticks internally; pass `0` if the signal logic handles exits. |
| `take_profit_pct` | number | Yes | Take profit expressed as a percentage. Pass `0` if the signal logic handles exits. |
| `qty_type` | string | Yes | `"fixed"` or `"percent"`. `"fixed"` means a fixed number of contracts. |
| `qty_value` | number | Yes | Number of contracts when `qty_type` is `"fixed"`. |
| `run_validation` | boolean | Optional | Ask the engine to run a post-hoc validation pass on the result. Default `true`. |
| `validation_iterations` | number | Optional | Number of Monte Carlo / permutation iterations used by validation. Engine clamps to its accepted range. Default `2000`. |

### 3.2 `POST /run` — response contract

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | `"ok"` or `"error"`. |
| `error` | string | Present only when `status` is `"error"`. The engine error message (often a Python traceback). |
| `engine_version` | string | Engine build identifier. |
| `execution_time_ms` | number | Total wall time of the engine run. |
| `kpis` | object | Key performance indicators. Fields used by this app: `total_trades`, `num_winning`, `num_losing`, `net_profit`, `win_rate`, `profit_factor`, `max_drawdown_pct`, `avg_winning`, `avg_losing`. |
| `equity_curve` | array | `{ date, equity }` points for charting. |
| `validation` | object | Structured validation verdict (if `run_validation` was true). |
| `validation_error` | string | Validation error message if validation failed. |

### 3.3 `GET /ping` — health check

Returns a small JSON payload indicating that the engine is alive. The exact shape is not strictly depended on by the app; it is used for manual diagnostics only.

## 4. Signal Code Contract

The `signal_code` field is a Python script that is executed by the engine inside a sandbox. The engine provides a pandas DataFrame named `df` with these columns:

| Column | Meaning |
| --- | --- |
| `Open` | Opening price |
| `High` | High price |
| `Low` | Low price |
| `Close` | Closing price |
| `Volume` | Volume |
| `df.index` | Timezone-aware pandas `DatetimeIndex` (UTC-aware) |

### 4.1 Required outputs

After execution, the script must leave these columns on `df`:

| Column | Type | Meaning |
| --- | --- | --- |
| `long_entry` | bool | True when a long position should be entered at this bar. |
| `long_exit` | bool | True when an open long position should be exited at this bar. |
| `short_entry` | bool | True when a short position should be entered at this bar. |
| `short_exit` | bool | True when an open short position should be exited at this bar. |

### 4.2 Allowed primitives

The engine preloads these helper functions and modules:

| Name | Purpose |
| --- | --- |
| `pd` | pandas |
| `np` | numpy |
| `calc_ema(series, length)` | Exponential moving average |
| `calc_sma(series, length)` | Simple moving average |
| `calc_rsi(series, length)` | RSI (default 14) |
| `calc_atr(df, length)` | Average true range |
| `calc_macd(series, fast, slow, signal)` | Returns `(macd_line, signal_line, histogram)` |
| `calc_obv(close, volume)` | On-balance volume |
| `calc_wma(series, length)` | Weighted moving average |
| `calc_hma(series, length)` | Hull moving average |
| `calc_highest(series, length)` | Rolling highest |
| `calc_lowest(series, length)` | Rolling lowest |
| `calc_donchian(high, low, length)` | Returns `(upper, lower, mid)` |
| `calc_ichimoku(high, low, ...)` | Returns dict with conversion, base, lead_a, lead_b |
| `detect_crossover(fast, slow)` | True when fast crosses above slow |
| `detect_crossunder(fast, slow)` | True when fast crosses below slow |
| `get_source(df, source_name)` | Returns price series (`"close"`, `"hl2"`, `"hlc3"`, `"ohlc4"`) |

### 4.3 Forbidden syntax

The engine sandbox rejects these. Signal code must not contain them:

- `import` statements of any kind
- `from ... import ...` statements
- References to `pytz`, `datetime`, `timezone`, `os`, `sys`, `subprocess`, `exec`, `eval`, `__import__`, `open()`
- `pd.Timestamp(..., tz=...)` with pytz objects

### 4.4 Timezone rules

The engine's historical bars use a timezone-aware `DatetimeIndex`. If the engine ever provides a tz-naive index, the code should localize it to UTC first, then convert:

```python
if isinstance(df.index, pd.DatetimeIndex) and df.index.tz is None:
    df.index = df.index.tz_localize('UTC')
```

After that, time-based filters can use `df.index.tz_convert('US/Eastern')`, `df.index.hour`, `df.index.minute`, etc.

## 5. Market Specification

| Property | Value |
| --- | --- |
| Primary symbol | MES (Micro E-mini S&P 500) |
| Point value | $5 per point |
| Tick size | $0.25 per tick |
| Available data | MES and ES bars |
| Timeframe | 5-minute bars (default) |
| Historical coverage | 18 years of FirstRate 5-minute data |

The engine evaluates signals on the MES/ES price series. Commission and slippage are modeled in the engine based on the `commission_pct` value.

## 6. Data Loading

| Property | Value |
| --- | --- |
| Data provider | FirstRate |
| Bar size | 5-minute |
| Index type | pandas `DatetimeIndex`, UTC-aware |
| Coverage | 18 years |

The engine loads the data internally before executing the signal code. The web app only provides date bounds. **Critical:** The `start_date` and `end_date` strings sent to the engine must be timezone-aware UTC timestamps (e.g. `2025-01-06T00:00:00Z` and `2025-01-10T23:59:59Z`). Sending bare `YYYY-MM-DD` strings can lead to tz-naive vs tz-aware comparison errors inside the engine.

## 7. Web App Orchestration Flow

The web app uses a Supabase Edge Function (`supabase/functions/run-backtest/index.ts`) as a thin orchestrator. It does not run the backtest itself; it coordinates the database, the AI signal generator, and the engine.

```text
┌──────────────┐     ┌────────────────────────┐     ┌──────────────┐
│   Web App    │────▶│  run-backtest Edge Fn  │────▶│   Database   │
│              │     │                        │     │ backtest_runs│
└──────────────┘     │  1. Read pending run    │     └──────────────┘
                     │  2. Generate signal   │────▶┌──────────────┐
                     │     code via Claude    │     │   Claude API │
                     │  3. Call engine /run   │────▶┌──────────────┐
                     │  4. Persist results    │     │ Backtest Engine│
                     │                        │     │   /run        │
                     └────────────────────────┘     └──────────────┘
```

### 7.1 Step-by-step

1. **Create row:** The web app inserts a `backtest_runs` row with `status='pending'`.
2. **Invoke edge function:** The web app calls `supabase.functions.invoke('run-backtest', { body: { run_id } })`.
3. **Read run:** The edge function reads the run, verifies it is `pending`, and sets `status='running'`.
4. **Generate signal code:** The edge function sends a system prompt and the strategy JSON to the Claude API. The model returns Python code. The edge function strips markdown fences and any `import`/`from` lines.
5. **Normalize timezone:** The edge function prepends a guard to the generated code that localizes a tz-naive index to UTC before any `tz_convert()` calls.
6. **Normalize date bounds:** The edge function converts `YYYY-MM-DD` start/end dates into explicit UTC ISO timestamps (`T00:00:00Z` / `T23:59:59Z`).
7. **Call engine:** The edge function POSTs to `{BACKTEST_ENGINE_URL}/run` with the signal code, date bounds, and capital settings.
8. **Write results:** The edge function updates the `backtest_runs` row with KPIs, equity curve, validation, status, and error message.
9. **Poll:** The web app polls the `backtest_runs` table every 5 seconds while a run is `pending` or `running`.

## 8. Database Table Contract

The web app owns the `backtest_runs` table. The edge function reads and writes it. The engine never touches this table.

Key columns used by the orchestrator:

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key; also used as `run_id` in the engine request. |
| `user_id` | Auth user who owns the run. |
| `status` | `pending`, `running`, `complete`, `failed`. |
| `strategy_name` | Human-readable name sent to the AI prompt. |
| `timeframe` | Bar timeframe (e.g. `5min`). |
| `start_date` / `end_date` | Date bounds as strings. Edge function normalizes to UTC timestamps. |
| `initial_balance` | Starting capital. |
| `stop_loss_ticks` / `take_profit_ticks` | Stop loss and take profit in ticks. |
| `max_trades_per_day` | Trade cap. |
| `direction` | `long`, `short`, or `long_short`. |
| `commission_pct` | Commission percentage. |
| `strategy_config` | Full JSON strategy configuration. |
| `total_trades`, `wins`, `losses`, `net_pnl`, `win_rate`, `profit_factor`, `max_drawdown`, `avg_winner`, `avg_loser` | KPIs returned by the engine. |
| `equity_curve` | JSON array of `{date, equity}`. |
| `ai_signal_code` | The final Python code that was sent to the engine (useful for debugging). |
| `engine_version` | Engine build identifier. |
| `execution_time_ms` | Engine wall time. |
| `results_detail` | Raw KPI object from the engine. |
| `validation` | Structured validation result. |
| `validation_error` | Validation error message. |
| `run_validation` | Whether validation was requested. |
| `validation_iterations` | Number of validation iterations. |
| `error_message` | Error text if `status` is `failed`. |

## 9. Troubleshooting Boundary

| Symptom | Where to fix |
| --- | --- |
| `Disallowed syntax: Import` | Edge function should strip imports; engine should also reject them. Both are valid, but the engine sandbox is the authoritative enforcer. |
| `NameError: name 'pytz' is not defined` | Signal code must not reference `pytz`. Fix in the AI prompt (edge function) or in the engine's sandbox helpers. |
| `TypeError: Cannot convert tz-naive timestamps` | Edge function prepends timezone guard; engine should also ensure data is tz-aware. |
| `TypeError: Cannot compare tz-naive and tz-aware timestamps` | Date bounds must be normalized to UTC-aware ISO timestamps. Edge function does this; engine comparison logic also needs tz-aware dates. |
| 500 from `/run` with a Python traceback | Engine repo bug. Fix in `mes-orb-strategy`, not the edge function. |
| Slow backtest | Reduce date range (e.g. one week) or timeframe. The engine runs the full requested date range. |
| `Claude API error` | AI gateway / Anthropic issue. Edge function surfaces the error. |

## 10. What This Spec Does NOT Cover

- The internal engine implementation (P&L calculation, slippage model, execution engine, etc.).
- The `mes-orb-strategy` repository layout or CI/CD.
- Exact engine response schemas for non-`/run` endpoints.
- UI/UX details of the Backtesting page (those live in the app codebase, not the engine spec).

## 11. Standalone App Notes

If an AI agent needs to recreate the backtesting flow in a standalone app, the agent should implement:

1. A `backtest_runs` table matching the contract above.
2. A thin orchestrator (edge function or serverless function) that reads the run, calls an LLM for signal code, and calls the engine `/run` endpoint.
3. The web UI that creates runs, polls for status, and displays KPIs and equity curves.
4. Environment variables for `BACKTEST_ENGINE_URL` and `BACKTEST_ENGINE_API_KEY`.

The engine itself should remain an external service; do not reimplement the engine inside the standalone app unless the engine repo is also included.
