import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
        const guruPriceId = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID");
        let newPlan = "starter";
        if (priceId === proPriceId) newPlan = "pro";
        else if (priceId === expertPriceId) newPlan = "expert";
        else if (priceId === guruPriceId) newPlan = "guru";

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

        // Write cancel-at-period-end state for trader subs regardless of status
        if (meta.supabase_user_id) {
          await admin.from("profiles").update({
            subscription_cancel_at_period_end: sub.cancel_at_period_end ?? false,
            subscription_ends_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          }).eq("user_id", meta.supabase_user_id);
          log("cancel state synced", { userId: meta.supabase_user_id, cancel_at_period_end: sub.cancel_at_period_end, cancel_at: sub.cancel_at });
        }

        const enrollmentId = meta.enrollment_id;
        if (!enrollmentId) {
          // No enrollment metadata — still try to sync plan_state for trader subs
          const updatedUserId = meta.supabase_user_id;
          if (updatedUserId) {
            const updatedPriceId = sub.items.data[0]?.price?.id;
            const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
            const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
            const guruPriceId = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID");
            let syncedPlan: string | null = null;
            if (updatedPriceId === proPriceId) syncedPlan = "pro";
            else if (updatedPriceId === expertPriceId) syncedPlan = "expert";
            else if (updatedPriceId === guruPriceId) syncedPlan = "guru";
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
          const guruPriceId = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID");
          let syncedPlan: string | null = null;
          if (updatedPriceId === proPriceId) syncedPlan = "pro";
          else if (updatedPriceId === expertPriceId) syncedPlan = "expert";
          else if (updatedPriceId === guruPriceId) syncedPlan = "guru";
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
        // Re-derive plan from Stripe rather than assuming "starter" — the customer
        // may still have OTHER active/trialing subscriptions.
        const deletedUserId = meta.supabase_user_id;
        if (deletedUserId) {
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
          const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");
          const guruPriceId = Deno.env.get("STRIPE_TEST_GURU_PRICE_ID");

          let resolvedPlan = "starter";
          let branch = "no_remaining_subs";

          if (customerId) {
            const all = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
            const remaining = all.data.filter(
              (s) => s.id !== sub.id && (s.status === "active" || s.status === "trialing"),
            );
            if (remaining.length > 0) {
              // Prefer the highest-tier remaining subscription (guru > expert > pro).
              const rank = (pid?: string) =>
                pid === guruPriceId ? 3 : pid === expertPriceId ? 2 : pid === proPriceId ? 1 : 0;
              remaining.sort((a, b) => rank(b.items.data[0]?.price?.id) - rank(a.items.data[0]?.price?.id));
              const priceId = remaining[0].items.data[0]?.price?.id;
              if (priceId === guruPriceId) resolvedPlan = "guru";
              else if (priceId === expertPriceId) resolvedPlan = "expert";
              else if (priceId === proPriceId) resolvedPlan = "pro";
              else resolvedPlan = "starter";
              branch = "kept_other_subscription";
            }
          }

          await admin.rpc("sync_plan_state", {
            p_user_id: deletedUserId,
            p_plan_state: resolvedPlan,
          });
          await admin.from("profiles").update({
            subscription_cancel_at_period_end: false,
            subscription_ends_at: null,
            payment_past_due: false,
            past_due_since: null,
          }).eq("user_id", deletedUserId);
          log("subscription.deleted resolved", { userId: deletedUserId, branch, resolvedPlan });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === "string"
          ? (invoice as any).subscription as string
          : ((invoice as any).subscription as Stripe.Subscription | null)?.id;
        if (!subId) { log("payment_failed — no subscription on invoice"); break; }
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) { log("payment_failed — no supabase_user_id in sub metadata"); break; }

        // Read current past_due_since so we only stamp the FIRST failure.
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("past_due_since")
          .eq("user_id", userId)
          .maybeSingle();
        const nowIso = new Date().toISOString();
        await admin.from("profiles").update({
          payment_past_due: true,
          past_due_since: (existingProfile as any)?.past_due_since ?? nowIso,
        }).eq("user_id", userId);
        log("payment_past_due set", { userId });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === "string"
          ? (invoice as any).subscription as string
          : ((invoice as any).subscription as Stripe.Subscription | null)?.id;
        if (!subId) { log("payment_succeeded — no subscription on invoice"); break; }
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) { log("payment_succeeded — no supabase_user_id in sub metadata"); break; }
        await admin.from("profiles").update({
          payment_past_due: false,
          past_due_since: null,
        }).eq("user_id", userId);
        log("payment_past_due cleared", { userId });
        break;
      }

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
