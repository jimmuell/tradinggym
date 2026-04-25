import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    if (!stripeKey) return json({ error: "config_error" }, 500);

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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: guru } = await admin
      .from("guru_profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete, stripe_connect_status")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!guru) return json({ error: "not_guru" }, 403);
    if (!guru.stripe_account_id) return json({ status: "not_started" });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const account = await stripe.accounts.retrieve(guru.stripe_account_id);

    let status: string;
    if (account.charges_enabled && account.payouts_enabled) {
      status = "active";
      if (!guru.stripe_onboarding_complete) {
        await admin
          .from("guru_profiles")
          .update({ stripe_onboarding_complete: true, stripe_connect_status: "active" })
          .eq("id", guru.id);
      }
    } else if (
      account.requirements?.currently_due &&
      account.requirements.currently_due.length > 0
    ) {
      status = "restricted";
      await admin
        .from("guru_profiles")
        .update({ stripe_connect_status: "restricted" })
        .eq("id", guru.id);
    } else {
      status = "pending";
    }

    return json({
      status,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CHECK-CONNECT-STATUS] ERROR:", msg);
    return json({ error: "internal" }, 500);
  }
});
