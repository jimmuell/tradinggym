// Edge Function: run-backtest
// Called by the web app after inserting a backtest_runs row with status='pending'
// Orchestrates: read config → Claude AI generates signal code → Engine API runs backtest → write results
//
// DEPLOY NOTE: Edits made via VS Code + GitHub do NOT auto-deploy this function.
// After pushing, ask the Lovable agent to "Redeploy run-backtest".
// See docs/DEPLOY_WORKFLOW.md for the full workflow.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toEngineUtcDateBound = (value: unknown, boundary: "start" | "end") => {
  if (typeof value !== "string" || !value.trim()) return value;

  const trimmed = value.trim();

  // DB date fields arrive as YYYY-MM-DD. Send explicit UTC bounds so the
  // engine compares tz-aware data_first timestamps against tz-aware config dates.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return boundary === "start"
      ? `${trimmed}T00:00:00Z`
      : `${trimmed}T23:59:59Z`;
  }

  // If a timestamp is already timezone-qualified, keep it as-is.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(trimmed)) return trimmed;

  // Otherwise make timestamp-like values explicitly UTC without changing wall time.
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return `${trimmed}Z`;

  return trimmed;
};

// Single source of truth for the generation model — used by BOTH the hash and the
// Claude API call so they can never drift apart.
const MODEL = "claude-sonnet-4-6";

// Hash-scheme version. Bump only if the canonicalization algorithm below changes,
// to force a clean cache break.
const SIGNAL_CACHE_SCHEME = 1;

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Deterministic JSON: recursively sort object keys so key order can never change the hash.
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
};

// Volatile / identity columns that must NOT affect the signal. Stripping these keeps
// the hash stable across unrelated edits and prevents cache thrash.
const VOLATILE_CONFIG_KEYS = new Set(["id", "user_id", "created_at", "updated_at"]);
const canonicalizeStrategyConfig = (
  cfg: Record<string, unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(cfg)) {
    if (VOLATILE_CONFIG_KEYS.has(k)) continue;
    out[k] = cfg[k];
  }
  return out;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let runIdForCleanup: string | null = null;
  let supabaseForCleanup: ReturnType<typeof createClient> | null = null;

  try {
    const body = await req.json();
    const { run_id } = body;
    if (!run_id) {
      return new Response(JSON.stringify({ error: "run_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForCleanup = supabase;
    runIdForCleanup = run_id;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const engineUrl = Deno.env.get("BACKTEST_ENGINE_URL")!;
    const engineApiKey = Deno.env.get("BACKTEST_ENGINE_API_KEY")!;

    // --- Step 1: Read the backtest run ---
    const { data: run, error: runError } = await supabase
      .from("backtest_runs")
      .select("*")
      .eq("id", run_id)
      .single();

    if (runError || !run) {
      return new Response(JSON.stringify({ error: "Run not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (run.status !== "pending") {
      return new Response(JSON.stringify({ error: "Run is not pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("backtest_runs")
      .update({ status: "running" })
      .eq("id", run_id);

    // --- Step 2: Read full strategy details if strategy_id is set ---
    let strategyConfig: Record<string, unknown> = (run.strategy_config as Record<string, unknown>) || {};
    if (run.strategy_id) {
      const { data: strategy } = await supabase
        .from("strategies")
        .select("*")
        .eq("id", run.strategy_id)
        .single();
      if (strategy) {
        strategyConfig = strategy as Record<string, unknown>;
      }
    }

    // Canonical generation input: drop volatile/identity fields so the signal — and
    // its cache key — depend only on the trading logic, not on row identity/timestamps.
    const canonicalConfig = canonicalizeStrategyConfig(strategyConfig);

    // --- Step 3: Call Claude API to generate signal code ---
    const systemPrompt = `You are a Python signal generator for a trading backtesting engine.

Given a trading strategy configuration as JSON, generate Python code that creates boolean signal columns on a pandas DataFrame called 'df' that has columns: Open, High, Low, Close, Volume.

AVAILABLE INDICATOR FUNCTIONS (already in scope, do NOT import them):
- calc_ema(series, length) → EMA
- calc_sma(series, length) → SMA  
- calc_rsi(series, length) → RSI (default 14)
- calc_atr(df, length) → ATR (needs df with High/Low/Close)
- calc_macd(series, fast, slow, signal) → returns (macd_line, signal_line, histogram)
- calc_obv(close, volume) → On-Balance Volume
- calc_wma(series, length) → Weighted MA
- calc_hma(series, length) → Hull MA
- calc_highest(series, length) → rolling highest
- calc_lowest(series, length) → rolling lowest
- calc_donchian(high, low, length) → returns (upper, lower, mid)
- calc_ichimoku(high, low, ...) → returns dict with conversion, base, lead_a, lead_b
- detect_crossover(fast, slow) → True when fast crosses above slow
- detect_crossunder(fast, slow) → True when fast crosses below slow
- get_source(df, source_name) → returns price series ("close", "hl2", "hlc3", "ohlc4")

PANDAS AND NUMPY are available as 'pd' and 'np'.

RULES:
1. You MUST create these columns on df: long_entry (bool), long_exit (bool), short_entry (bool), short_exit (bool)
2. Set them to False by default, then apply your logic
3. Do NOT use any import statements (they are stripped and any referenced module name will raise NameError)
4. Do NOT use open(), os, sys, subprocess, exec, eval, or __import__
5. Do NOT reference pytz, datetime, timezone, pd.Timestamp(tz=...) with pytz objects, or any other module — only 'pd', 'np', and the listed helpers exist
6. Return ONLY the executable Python code, no markdown fences, no explanations
7. The code will be executed with exec() where df is already defined
8. Use .fillna(False) on all boolean columns to avoid NaN issues
9. For time-based filters (like ORB), use df.index which is already normalized to a timezone-aware pandas DatetimeIndex before your code runs. For timezone conversion use df.index.tz_convert('US/Eastern') (pandas accepts tz strings natively — no pytz needed). Use df.index.hour and df.index.minute for hour/minute filters`;

    // IMPORTANT: feed ONLY the inputs that determine the signal. Date range, risk
    // params (stop/take-profit/qty), balance, commission, and direction are applied by
    // the engine downstream and are deliberately excluded — including them here is what
    // made the signal look run-specific and blocked determinism.
    const userPrompt = `Generate signal code for this trading strategy configuration:

Timeframe: ${run.timeframe}

Full Strategy Config:
${JSON.stringify(canonicalConfig, null, 2)}`;

    // --- Signal cache: deterministic reuse keyed on generation inputs only ---
    const promptFp = (await sha256Hex(systemPrompt)).slice(0, 16);
    const signalHash = await sha256Hex(
      stableStringify({
        v: SIGNAL_CACHE_SCHEME,
        model: MODEL,
        prompt_fp: promptFp,
        timeframe: run.timeframe ?? null,
        cfg: canonicalConfig,
      }),
    );

    const forceRegenerate = body.force_regenerate === true;
    let generatedSignalCode: string | null = null;
    let cacheStatus: "hit" | "miss" | "forced" = forceRegenerate ? "forced" : "miss";

    if (!forceRegenerate) {
      const { data: cached } = await supabase
        .from("signal_cache")
        .select("signal_code, hit_count")
        .eq("hash", signalHash)
        .maybeSingle();

      if (cached?.signal_code) {
        generatedSignalCode = cached.signal_code as string;
        cacheStatus = "hit";
        // Best-effort usage bump; never block the run on it.
        try {
          await supabase
            .from("signal_cache")
            .update({
              last_used_at: new Date().toISOString(),
              hit_count: ((cached.hit_count as number) ?? 0) + 1,
            })
            .eq("hash", signalHash);
        } catch (_) { /* non-fatal */ }
      }
    }

    if (generatedSignalCode === null) {
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt,
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        await supabase
          .from("backtest_runs")
          .update({
            status: "failed",
            error_message: `Claude API error: ${claudeResponse.status} - ${errorText.substring(0, 500)}`,
          })
          .eq("id", run_id);
        return new Response(JSON.stringify({ error: "AI signal generation failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const claudeData = await claudeResponse.json();
      generatedSignalCode = claudeData.content
        ?.filter((block: { type: string }) => block.type === "text")
        ?.map((block: { text: string }) => block.text)
        ?.join("\n")
        ?.replace(/```python\n?/g, "")
        ?.replace(/```\n?/g, "")
        ?.trim()
        // Defensive: strip any import/from-import lines Claude may emit despite the system prompt.
        // The engine sandbox rejects them with "Disallowed syntax: Import".
        ?.split("\n")
        ?.filter((line: string) => !/^\s*(import\s+|from\s+\S+\s+import\s+)/.test(line))
        ?.join("\n")
        ?.trim();

      if (!generatedSignalCode) {
        await supabase
          .from("backtest_runs")
          .update({
            status: "failed",
            error_message: "Claude returned empty signal code",
            ai_signal_code: JSON.stringify(claudeData.content),
          })
          .eq("id", run_id);
        return new Response(JSON.stringify({ error: "Empty signal code" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Persist to the cache for reuse. onConflict overwrites on force-regenerate.
      // Store the RAW code only — the timezone guard is re-applied at use time and is
      // intentionally NOT part of the cached/hashed artifact.
      try {
        await supabase.from("signal_cache").upsert(
          {
            hash: signalHash,
            signal_code: generatedSignalCode,
            model: MODEL,
            prompt_fp: promptFp,
            timeframe: run.timeframe ?? null,
            strategy_id: run.strategy_id ?? null,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "hash" },
        );
      } catch (_) { /* cache write is non-fatal; the run still proceeds */ }
    }

    // Defensive timezone normalization: the engine can provide tz-naive timestamps.
    // Generated strategies commonly call df.index.tz_convert('US/Eastern'), which
    // raises unless the index is first localized. Assume tz-naive engine data is UTC.
    const timezoneGuard = `if isinstance(df.index, pd.DatetimeIndex) and df.index.tz is None:
    df.index = df.index.tz_localize('UTC')`;
    const signalCode = `${timezoneGuard}\n\n${generatedSignalCode}`;

    console.log("SIGNAL_CACHE", JSON.stringify({
      run_id,
      hash: signalHash,
      status: cacheStatus,
      model: MODEL,
      prompt_fp: promptFp,
    }));

    // --- Step 4: Call Engine API ---
    // Validation budget: read from the request, falling back to today's defaults
    // (so callers that omit it — e.g. the current UI — behave identically).
    // run_validation: default true (unchanged behavior if caller omits it)
    const runValidation = body.run_validation ?? true;
    // validation_iterations: default 2000, clamped to the engine's accepted range
    // (defense-in-depth — never forward an out-of-range value to the engine)
    const rawIters = body.validation_iterations ?? 2000;
    const validationIterations = Math.min(20000, Math.max(100, Math.trunc(rawIters)));

    const engineStartDate = toEngineUtcDateBound(run.start_date, "start");
    const engineEndDate = toEngineUtcDateBound(run.end_date, "end");

    // Engine risk contract (v24+): points are sent as-is; no points↔ticks conversion.
    // Engine fields: stop_loss_pct, take_profit_pct, stop_loss_points, take_profit_points, slippage_ticks.
    const sentStopLossPoints = Number(run.stop_loss_points ?? 0);
    const sentTakeProfitPoints = Number(run.take_profit_points ?? 0);
    const sentStopLossPct = Number(run.stop_loss_pct ?? 0);
    const sentTakeProfitPct = Number(run.take_profit_pct ?? 0);
    const sentSlippageTicks = Number(run.slippage_ticks ?? 0);

    // ADR-030: flat $/round-trip commission. If the row carries the new fields,
    // derive commission_rate=0 here. Legacy rows (commission_pct only) fall back
    // to the percent model so historical reruns remain reproducible.
    const commissionMode: string = (run.commission_mode as string)
      ?? (run.commission_per_rt != null ? "flat_per_rt" : "pct");
    const commissionPerRt = commissionMode === "flat_per_rt"
      ? Number(run.commission_per_rt ?? 1.24)
      : 0;
    const commissionRate = commissionMode === "flat_per_rt"
      ? 0
      : Number(run.commission_pct ?? 0.1);

    console.log("ENGINE_REQUEST_RISK", JSON.stringify({
      run_id,
      row_stop_loss_pct: run.stop_loss_pct,
      row_stop_loss_points: run.stop_loss_points,
      row_take_profit_points: run.take_profit_points,
      row_slippage_ticks: run.slippage_ticks,
      sent_stop_loss_pct: sentStopLossPct,
      sent_take_profit_pct: sentTakeProfitPct,
      sent_stop_loss_points: sentStopLossPoints,
      sent_take_profit_points: sentTakeProfitPoints,
      sent_slippage_ticks: sentSlippageTicks,
      sent_qty_value: run.qty_value ?? 1,
      sent_commission_mode: commissionMode,
      sent_commission_per_rt: commissionPerRt,
      sent_commission_rate: commissionRate,
    }));

    // ADR-037 async: ONE path for every run. The engine's /run/async runs the COMPARE
    // pipeline in the background and writes progress + results directly to this
    // backtest_runs row. The app polls the row and renders on complete/failed.

    // Persist the fields the ENGINE does not write, BEFORE handing off (from here on the
    // engine owns status + the result columns).
    await supabase
      .from("backtest_runs")
      .update({
        status: "running",
        progress: 0,
        ai_signal_code: signalCode,
        signal_hash: signalHash,
        run_validation: runValidation,
        validation_iterations: validationIterations,
        error_message: null,
      })
      .eq("id", run_id);

    const engineResponse = await fetch(`${engineUrl}/run/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": engineApiKey,
      },
      body: JSON.stringify({
        run_id, // REQUIRED by /run/async (engine's AsyncBacktestRequest)
        signal_code: signalCode,
        direction: run.direction || "long_short",
        initial_capital: run.initial_balance || 10000,
        commission_pct: commissionRate,
        commission_mode: commissionMode,
        commission_per_rt: commissionPerRt,
        commission_rate: commissionRate,
        start_date: engineStartDate,
        end_date: engineEndDate,
        stop_loss_pct: sentStopLossPct,
        take_profit_pct: sentTakeProfitPct,
        stop_loss_points: sentStopLossPoints,
        take_profit_points: sentTakeProfitPoints,
        slippage_ticks: sentSlippageTicks,
        qty_type: "fixed",
        qty_value: run.qty_value ?? 1,
        run_validation: runValidation,
        validation_iterations: validationIterations,
        callback_url: `${supabaseUrl}/functions/v1/backtest-callback`,
        callback_secret: Deno.env.get("BACKTEST_CALLBACK_SECRET")!,
      }),
    });

    // /run/async returns 202 Accepted. Anything else is a handoff failure — mark the row
    // failed with a clear reason and stop. (503 means the engine is missing its Supabase
    // service-role env vars on Railway.)
    if (engineResponse.status !== 202) {
      const errorText = await engineResponse.text();
      const hint =
        engineResponse.status === 503
          ? " (engine missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
          : "";
      await supabase
        .from("backtest_runs")
        .update({
          status: "failed",
          error_message: `Engine did not accept the async job: ${engineResponse.status}${hint} - ${errorText.substring(0, 400)}`,
          ai_signal_code: signalCode,
        })
        .eq("id", run_id);
      return new Response(JSON.stringify({ error: "Engine did not accept the job" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accepted. The engine drives the row to complete/failed in the background; the app polls.
    return new Response(JSON.stringify({ run_id, status: "accepted" }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("run-backtest error:", err);
    // Ensure no run is left stuck in 'running'
    if (runIdForCleanup && supabaseForCleanup) {
      try {
        await supabaseForCleanup
          .from("backtest_runs")
          .update({
            status: "failed",
            error_message: `Orchestrator error: ${(err as Error).message}`.substring(0, 2000),
          })
          .eq("id", runIdForCleanup);
      } catch (_) { /* swallow */ }
    }
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
