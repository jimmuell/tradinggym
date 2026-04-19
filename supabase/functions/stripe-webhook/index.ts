import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("config error — missing keys");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    log("signature verification failed", String(err));
    return new Response("Invalid signature", { status: 400 });
  }
  log("event", { type: event.type, id: event.id });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const meta = sub.metadata ?? {};
        const enrollmentId = meta.enrollment_id;
        if (!enrollmentId) {
          log("no enrollment_id in metadata — ignoring");
          break;
        }
        // Idempotent — only update if not already active with this sub
        const { data: existing } = await admin
          .from("cohort_enrollments")
          .select("status, stripe_subscription_id")
          .eq("id", enrollmentId)
          .maybeSingle();
        if (
          existing?.status === "active" &&
          existing.stripe_subscription_id === sub.id
        ) {
          log("already synced", { enrollmentId });
          break;
        }
        await admin
          .from("cohort_enrollments")
          .update({
            status: "active",
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          })
          .eq("id", enrollmentId);
        log("enrollment synced", { enrollmentId });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const meta = sub.metadata ?? {};
        if (meta.enrollment_id) {
          await admin
            .from("cohort_enrollments")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("id", meta.enrollment_id);
          log("enrollment cancelled", { enrollmentId: meta.enrollment_id });
        }
        break;
      }

      case "invoice.payment_failed":
        log("payment failed — ignored for now", { invoice: (event.data.object as Stripe.Invoice).id });
        break;

      default:
        log("unhandled event type — ignoring");
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    log("handler error", String(err));
    return new Response("Internal error", { status: 500 });
  }
});
