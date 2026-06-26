// Edge Function: run-backtest
// Called by the web app after inserting a backtest_runs row with status='pending'
// Orchestrates: read config → Claude AI generates signal code → Engine API runs backtest → write results

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const engineApiKey = Deno.env.get("BACKTEST_ENGINE_API_KEY") || "tg-backtest-dev-2026";

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
3. Do NOT use any import statements
4. Do NOT use open(), os, sys, subprocess, exec, eval, or __import__
5. Return ONLY the executable Python code, no markdown fences, no explanations
6. The code will be executed with exec() where df is already defined
7. Use .fillna(False) on all boolean columns to avoid NaN issues
8. For time-based filters (like ORB), use df.index which contains datetime timestamps`;

    const userPrompt = `Generate signal code for this trading strategy configuration:

Strategy Name: ${run.strategy_name}
Timeframe: ${run.timeframe}
Date Range: ${run.start_date} to ${run.end_date}
Stop Loss (ticks): ${run.stop_loss_ticks}
Take Profit (ticks): ${run.take_profit_ticks}
Max Trades Per Day: ${run.max_trades_per_day}

Full Strategy Config:
${JSON.stringify(strategyConfig, null, 2)}`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
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
    const signalCode = claudeData.content
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

    if (!signalCode) {
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

    // --- Step 4: Call Engine API ---
    // Validation budget: read from the request, falling back to today's defaults
    // (so callers that omit it — e.g. the current UI — behave identically).
    // run_validation: default true (unchanged behavior if caller omits it)
    const runValidation = body.run_validation ?? true;
    // validation_iterations: default 2000, clamped to the engine's accepted range
    // (defense-in-depth — never forward an out-of-range value to the engine)
    const rawIters = body.validation_iterations ?? 2000;
    const validationIterations = Math.min(20000, Math.max(100, Math.trunc(rawIters)));

    const engineResponse = await fetch(`${engineUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": engineApiKey,
      },
      body: JSON.stringify({
        signal_code: signalCode,
        direction: run.direction || "long_short",
        initial_capital: run.initial_balance || 10000,
        commission_pct: run.commission_pct || 0.1,
        start_date: run.start_date,
        end_date: run.end_date,
        stop_loss_pct: 0,
        take_profit_pct: 0,
        qty_type: "fixed",
        qty_value: 1.0,
        // Ask the engine for its honest validation verdict. Budget read from the
        // request with fallback to defaults (see above); kept modest so /run
        // stays responsive.
        run_validation: runValidation,
        validation_iterations: validationIterations,
      }),
    });

    if (!engineResponse.ok) {
      const errorText = await engineResponse.text();
      await supabase
        .from("backtest_runs")
        .update({
          status: "failed",
          error_message: `Engine API error: ${engineResponse.status} - ${errorText.substring(0, 500)}`,
          ai_signal_code: signalCode,
        })
        .eq("id", run_id);
      return new Response(JSON.stringify({ error: "Engine execution failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const engineData = await engineResponse.json();

    if (engineData.status === "error") {
      await supabase
        .from("backtest_runs")
        .update({
          status: "failed",
          error_message: engineData.error?.substring(0, 2000),
          ai_signal_code: signalCode,
          engine_version: engineData.engine_version,
          execution_time_ms: engineData.execution_time_ms,
        })
        .eq("id", run_id);
      return new Response(JSON.stringify({ error: engineData.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 5: Write results back ---
    const kpis = engineData.kpis || {};

    await supabase
      .from("backtest_runs")
      .update({
        status: "complete",
        total_trades: kpis.total_trades || 0,
        wins: kpis.num_winning || 0,
        losses: kpis.num_losing || 0,
        net_pnl: kpis.net_profit || 0,
        win_rate: kpis.win_rate || 0,
        profit_factor: kpis.profit_factor || 0,
        max_drawdown: kpis.max_drawdown_pct || 0,
        avg_winner: kpis.avg_winning || 0,
        avg_loser: kpis.avg_losing || 0,
        results_detail: kpis,
        equity_curve: engineData.equity_curve || [],
        validation: engineData.validation ?? null,
        validation_error: engineData.validation_error ?? null,
        run_validation: runValidation,
        validation_iterations: validationIterations,
        ai_signal_code: signalCode,
        engine_version: engineData.engine_version,
        execution_time_ms: engineData.execution_time_ms,
        error_message: null,
      })
      .eq("id", run_id);

    return new Response(
      JSON.stringify({
        success: true,
        run_id,
        total_trades: kpis.total_trades,
        net_profit: kpis.net_profit,
        win_rate: kpis.win_rate,
        execution_time_ms: engineData.execution_time_ms,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
