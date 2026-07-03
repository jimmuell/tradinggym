import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-callback-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Only these columns may be written via the callback. A leaked secret still cannot
// scribble arbitrary columns. Keep in sync with the engine's write shape (ADR-038).
const ALLOWED = new Set([
  "status", "progress", "net_pnl", "total_trades", "wins", "losses",
  "win_rate", "profit_factor", "max_drawdown", "avg_winner", "avg_loser",
  "results_detail", "equity_curve", "engine_version", "execution_time_ms",
  "signal_hash", "validation", "validation_error", "error_message",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMINAL = new Set(["complete", "failed"]);

// Constant-time string compare (avoid timing side-channel on the secret).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const expected = Deno.env.get("BACKTEST_CALLBACK_SECRET");
  if (!expected) {
    // Misconfiguration, not a bad caller.
    return new Response(JSON.stringify({ error: "callback secret not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const provided = req.headers.get("x-callback-secret") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const run_id = body?.run_id;
  const fields = body?.fields;
  if (typeof run_id !== "string" || !UUID_RE.test(run_id) || typeof fields !== "object" || !fields) {
    return new Response(JSON.stringify({ error: "run_id (uuid) and fields object required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Whitelist only allowed columns.
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (ALLOWED.has(k)) update[k] = v;
  if (Object.keys(update).length === 0) {
    return new Response(JSON.stringify({ error: "no writable fields" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Idempotency: never move a terminal row (complete/failed) back to running.
  const { data: current } = await supabase
    .from("backtest_runs").select("status").eq("id", run_id).single();
  if (current && TERMINAL.has(current.status) && !TERMINAL.has(String(update.status ?? current.status))) {
    return new Response(JSON.stringify({ ok: true, skipped: "row already terminal" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("backtest_runs").update(update).eq("id", run_id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
