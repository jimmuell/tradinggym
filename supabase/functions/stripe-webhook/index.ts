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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription)?.id;
        if (!subId) { log("no subscription on session"); break; }

        const sub = await stripe.subscriptions.retrieve(subId);
        const priceId = sub.items.data[0]?.price?.id;
        const userId = sub.metadata?.supabase_user_id
          ?? session.metadata?.supabase_user_id;
        if (!userId) { log("no supabase_user_id in metadata"); break; }

        const customerId = typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer)?.id;

        const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
        const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
        let newPlan = "starter";
        if (priceId === proPriceId) newPlan = "pro";
        else if (priceId === expertPriceId) newPlan = "expert";

        await admin.rpc("sync_plan_state", {
          p_user_id: userId,
          p_plan_state: newPlan,
          p_stripe_customer_id: customerId ?? null,
        });
        log("plan synced via checkout", { userId, newPlan });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const meta = sub.metadata ?? {};
        const enrollmentId = meta.enrollment_id;
        if (!enrollmentId) {
          // No enrollment metadata — still try to sync plan_state for trader subs
          const updatedUserId = meta.supabase_user_id;
          if (updatedUserId) {
            const updatedPriceId = sub.items.data[0]?.price?.id;
            const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
            const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
            let syncedPlan: string | null = null;
            if (updatedPriceId === proPriceId) syncedPlan = "pro";
            else if (updatedPriceId === expertPriceId) syncedPlan = "expert";
            if (syncedPlan && sub.status === "active") {
              await admin.rpc("sync_plan_state", {
                p_user_id: updatedUserId,
                p_plan_state: syncedPlan,
              });
              log("plan synced via sub update", { userId: updatedUserId, syncedPlan });
            }
          } else {
            log("no enrollment_id or supabase_user_id — ignoring");
          }
          break;
        }
        // Idempotent — only update if not already active with this sub
        const { data: existing } = await admin
          .from("class_enrollments")
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
          .from("class_enrollments")
          .update({
            status: "active",
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          })
          .eq("id", enrollmentId);
        log("enrollment synced", { enrollmentId });

        // Expert trial expiration check
        const { data: trialEnrollment } = await admin
          .from("class_enrollments")
          .select("id, enrollment_type, trial_expires_at, status")
          .eq("id", enrollmentId)
          .maybeSingle();

        if (
          trialEnrollment &&
          trialEnrollment.enrollment_type === "expert_trial" &&
          trialEnrollment.status === "trial" &&
          trialEnrollment.trial_expires_at
        ) {
          const trialEnd = new Date(trialEnrollment.trial_expires_at);
          if (new Date() > trialEnd) {
            await admin
              .from("class_enrollments")
              .update({
                enrollment_type: "organic",
                status: "active",
                commission_rate: 20,
                billing_starts_at: new Date().toISOString(),
                trial_expires_at: null,
              })
              .eq("id", trialEnrollment.id);

            await stripe.subscriptions.update(sub.id, {
              metadata: {
                ...(sub.metadata ?? {}),
                enrollment_type: "organic",
                commission_rate: "20",
                trial_expires_at: "",
              },
            });

            log("expert trial converted to organic", { enrollmentId: trialEnrollment.id });
          }
        }

        // Sync plan_state on subscription changes (upgrade/downgrade)
        const updatedUserId = meta.supabase_user_id;
        if (updatedUserId) {
          const updatedPriceId = sub.items.data[0]?.price?.id;
          const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
          const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
          let syncedPlan: string | null = null;
          if (updatedPriceId === proPriceId) syncedPlan = "pro";
          else if (updatedPriceId === expertPriceId) syncedPlan = "expert";
          if (syncedPlan && sub.status === "active") {
            await admin.rpc("sync_plan_state", {
              p_user_id: updatedUserId,
              p_plan_state: syncedPlan,
            });
            log("plan synced via sub update", { userId: updatedUserId, syncedPlan });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const meta = sub.metadata ?? {};
        if (meta.enrollment_id) {
          await admin
            .from("class_enrollments")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("id", meta.enrollment_id);
          log("enrollment cancelled", { enrollmentId: meta.enrollment_id });
        }
        // Sync plan_state back to starter when subscription is cancelled
        const deletedUserId = meta.supabase_user_id;
        if (deletedUserId) {
          await admin.rpc("sync_plan_state", {
            p_user_id: deletedUserId,
            p_plan_state: "starter",
          });
          log("plan downgraded to starter", { userId: deletedUserId });
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
