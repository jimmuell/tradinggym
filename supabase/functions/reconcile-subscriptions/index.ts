import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const s = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECONCILE] ${step}${s}`);
};

const PRO = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID") ?? "";
const EXPERT = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID") ?? "";
const GURU = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID") ?? "";

function planFromPriceId(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  if (priceId === PRO) return "pro";
  if (priceId === EXPERT) return "expert";
  if (priceId === GURU) return "guru";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let checked = 0;
    let driftCount = 0;
    const drifted: Array<{ user_id: string; app: string; stripe: string }> = [];

    const pageSize = 100;
    let from = 0;

    while (true) {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, plan_state, role, stripe_customer_id")
        .not("stripe_customer_id", "is", null)
        .neq("plan_state", "admin")
        .neq("role", "admin")
        .range(from, from + pageSize - 1);

      if (error) throw error;
      if (!profiles || profiles.length === 0) break;

      for (const p of profiles) {
        const userId = p.user_id as string;
        const customerId = p.stripe_customer_id as string;
        const appPlan = (p.plan_state as string) ?? "starter";
        let stripePlan = "starter";
        let stripeStatus: string | null = "none";
        let note: string | null = null;

        try {
          const customer = await stripe.customers.retrieve(customerId);
          // deleted customer surfaces as { deleted: true }
          // deno-lint-ignore no-explicit-any
          if ((customer as any).deleted) {
            note = "customer not found in Stripe";
            await supabase.from("plan_reconciliation_log").insert({
              user_id: userId,
              stripe_customer_id: customerId,
              app_plan_state: appPlan,
              stripe_plan_state: "starter",
              stripe_status: "none",
              drift: false,
              note,
            });
            checked++;
            continue;
          }

          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 10,
          });

          const activeSub = subs.data.find(
            (s) => s.status === "active" || s.status === "trialing",
          );
          if (activeSub) {
            stripeStatus = activeSub.status;
            const priceId = activeSub.items.data[0]?.price?.id ?? null;
            const mapped = planFromPriceId(priceId);
            if (mapped) stripePlan = mapped;
          } else if (subs.data.length > 0) {
            stripeStatus = subs.data[0].status;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.toLowerCase().includes("no such customer")) {
            note = "customer not found in Stripe";
            await supabase.from("plan_reconciliation_log").insert({
              user_id: userId,
              stripe_customer_id: customerId,
              app_plan_state: appPlan,
              stripe_plan_state: "starter",
              stripe_status: "none",
              drift: false,
              note,
            });
            checked++;
            continue;
          }
          note = `stripe error: ${msg.slice(0, 200)}`;
          await supabase.from("plan_reconciliation_log").insert({
            user_id: userId,
            stripe_customer_id: customerId,
            app_plan_state: appPlan,
            stripe_plan_state: appPlan,
            stripe_status: null,
            drift: false,
            note,
          });
          checked++;
          continue;
        }

        const drift = appPlan !== stripePlan;
        await supabase.from("plan_reconciliation_log").insert({
          user_id: userId,
          stripe_customer_id: customerId,
          app_plan_state: appPlan,
          stripe_plan_state: stripePlan,
          stripe_status: stripeStatus,
          drift,
          note,
        });
        checked++;
        if (drift) {
          driftCount++;
          drifted.push({ user_id: userId, app: appPlan, stripe: stripePlan });
        }
      }

      if (profiles.length < pageSize) break;
      from += pageSize;
    }

    log("done", { checked, driftCount });

    return new Response(
      JSON.stringify({ checked, drift_count: driftCount, drifted }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
