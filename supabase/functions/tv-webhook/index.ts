import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TICK_SIZE = 0.25;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    return json({ status: "ok", service: "tv-webhook" });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("WEBHOOK_SECRET") ?? "tg-webhook-2026";

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, direction, price, secret } = payload as {
    action?: string;
    direction?: string;
    price?: number;
    secret?: string;
  };
  const contracts = Number((payload as { contracts?: number }).contracts ?? 1);
  const strategy = String((payload as { strategy?: string }).strategy ?? "unknown");

  if (secret !== expectedSecret) return json({ error: "Unauthorized" }, 401);
  if (action !== "entry" && action !== "exit") return json({ error: "Invalid action" }, 400);
  if (direction !== "long" && direction !== "short") return json({ error: "Invalid direction" }, 400);
  if (typeof price !== "number" || !(price > 0)) return json({ error: "Invalid price" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const { data: session, error: sessionError } = await supabase
    .from("trading_sessions")
    .select("*")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) return json({ error: sessionError.message }, 500);
  if (!session) return json({ error: "No active trading session" }, 400);

  const tickValue = Number(session.tick_value ?? 1.25);
  const costPerTrade = Number(session.cost_per_trade ?? 0);
  const commission = Number((costPerTrade * contracts).toFixed(4));

  if (action === "entry") {
    const { data, error } = await supabase
      .from("live_trades")
      .insert({
        user_id: session.user_id,
        trading_session_id: session.id,
        direction,
        entry_price: price,
        contracts,
        strategy,
        commission,
        opened_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ status: "entry_logged", trade_id: data.id });
  }

  // exit
  const { data: openTrade, error: openErr } = await supabase
    .from("live_trades")
    .select("*")
    .eq("trading_session_id", session.id)
    .eq("direction", direction)
    .is("result", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openErr) return json({ error: openErr.message }, 500);
  if (!openTrade) return json({ error: "No matching open trade" }, 400);

  const entryPrice = Number(openTrade.entry_price);
  const rawTicks =
    direction === "long"
      ? (price - entryPrice) / TICK_SIZE
      : (entryPrice - price) / TICK_SIZE;
  const ticks = Number(rawTicks.toFixed(2));
  const grossPnl = Number((rawTicks * tickValue * contracts).toFixed(2));
  const netPnl = Number((grossPnl - commission).toFixed(2));
  const result = grossPnl > 0 ? "win" : grossPnl < 0 ? "loss" : "breakeven";

  const { error: updateErr } = await supabase
    .from("live_trades")
    .update({ result, gross_pnl: grossPnl, net_pnl: netPnl, ticks, commission })
    .eq("id", openTrade.id);

  if (updateErr) return json({ error: updateErr.message }, 500);
  return json({ status: "exit_logged", gross_pnl: grossPnl, net_pnl: netPnl });
});
