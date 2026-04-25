import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "config_error", message: "Stripe key missing" }, 500);

    const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
    const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
    const guruPriceId = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user?.email) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const priceId = body?.priceId as string | undefined;
    if (!priceId || (priceId !== proPriceId && priceId !== expertPriceId && priceId !== guruPriceId)) {
      return json({ error: "invalid_price", message: "Invalid priceId" }, 400);
    }
    let planName = "starter";
    if (priceId === proPriceId) planName = "pro";
    else if (priceId === expertPriceId) planName = "expert";
    else if (priceId === guruPriceId) planName = "guru";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("plan_state, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.rpc("sync_plan_state", {
        p_user_id: user.id,
        p_plan_state: profile?.plan_state ?? "starter",
        p_stripe_customer_id: customerId,
      });
      log("created stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") ?? "https://keen-chart-clone.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: planName },
      },
      allow_promotion_codes: true,
    });

    log("session created", { id: session.id, plan: planName });
    return json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CREATE-CHECKOUT-SESSION] ERROR:", msg);
    return json({ error: "stripe_error", message: msg }, 500);
  }
});
