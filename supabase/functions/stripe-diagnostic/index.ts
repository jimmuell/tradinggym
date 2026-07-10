import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Read-only diagnostic — no secret values exposed. Gate via a shared diagnostic token
    // so it is not fully public, but avoids requiring an admin session in the caller.
    const token = req.headers.get("x-diagnostic-token") ?? new URL(req.url).searchParams.get("token");
    if (token !== "run") return json({ error: "forbidden" }, 403);


    const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const prefix = key.substring(0, 8);
    let mode: string = "unknown";
    if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) mode = "test";
    else if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) mode = "live";

    const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });

    const result: Record<string, unknown> = {
      key_prefix: prefix,
      key_mode: mode,
      key_type: key.startsWith("rk_") ? "restricted" : key.startsWith("sk_") ? "secret" : "unknown",
    };

    // Account ID
    try {
      const acct = await stripe.accounts.retrieve();
      result.account_id = acct.id;
      result.expected_account_id = "acct_1SaeRZQ1O0rn4aqC";
      result.account_matches_expected = acct.id === "acct_1SaeRZQ1O0rn4aqC";
    } catch (e) {
      result.account_error = e instanceof Error ? e.message : String(e);
    }

    // Retrieve the hardcoded frontend price
    const HARDCODED = "price_1TrlygQ1O0rn4aqCUYcaX4OG";
    try {
      const p = await stripe.prices.retrieve(HARDCODED);
      result.hardcoded_price_check = { id: HARDCODED, status: "success", livemode: p.livemode, active: p.active };
    } catch (e) {
      result.hardcoded_price_check = { id: HARDCODED, status: "error", message: e instanceof Error ? e.message : String(e) };
    }

    // Env-configured price IDs
    const envPriceNames = [
      "STRIPE_TEST_PRO_PRICE_ID",
      "STRIPE_TEST_EXPERT_PRICE_ID",
      "STRIPE_TEST_GURU_PRICE_ID",
    ];
    const priceChecks: Record<string, unknown> = {};
    for (const name of envPriceNames) {
      const id = Deno.env.get(name);
      if (!id) {
        priceChecks[name] = { status: "unset" };
        continue;
      }
      try {
        const p = await stripe.prices.retrieve(id);
        priceChecks[name] = { id, status: "success", livemode: p.livemode, active: p.active };
      } catch (e) {
        priceChecks[name] = { id, status: "error", message: e instanceof Error ? e.message : String(e) };
      }
    }
    result.env_price_checks = priceChecks;

    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
