import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://keen-chart-clone.lovable.app";
    if (!stripeKey) return json({ error: "config_error", message: "Stripe key missing" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: guru } = await admin
      .from("guru_profiles")
      .select("id, status, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!guru || guru.status !== "active") {
      return json({ error: "not_guru", message: "Active Guru profile required" }, 403);
    }

    if (guru.stripe_onboarding_complete) {
      return json({ error: "already_connected", message: "Stripe account already connected" }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let accountId = guru.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        metadata: { guru_id: guru.id, user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await admin
        .from("guru_profiles")
        .update({
          stripe_account_id: accountId,
          stripe_connect_status: "pending",
        })
        .eq("id", guru.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: `${siteUrl}/guru/payouts?connect=complete`,
      refresh_url: `${siteUrl}/guru/payouts?connect=refresh`,
      type: "account_onboarding",
    });

    return json({ url: accountLink.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CREATE-CONNECT-ACCOUNT] ERROR:", msg);
    return json({ error: "internal", message: "Could not start Stripe onboarding." }, 500);
  }
});
