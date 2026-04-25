import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ENROLL-WITH-GURU] ${step}${d}`);
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
    const proPriceId = Deno.env.get("STRIPE_TEST_PRO_PRICE_ID");
    const expertPriceId = Deno.env.get("STRIPE_TEST_EXPERT_PRICE_ID");

    if (!stripeKey) return json({ error: "config_error", message: "Stripe key missing" }, 500);
    if (!proPriceId || !expertPriceId) {
      return json(
        { error: "config_error", message: "Pro/Expert price IDs not configured" },
        500,
      );
    }

    // Auth — validate JWT via anon client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized", message: "Missing auth" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user?.email) {
      return json({ error: "unauthorized", message: "Invalid session" }, 401);
    }
    const user = userData.user;
    log("authenticated", { uid: user.id });

    const body = await req.json().catch(() => ({}));
    const guruId: string | undefined = body.guru_id;
    const referralCode: string | undefined = body.referral_code?.trim() || undefined;
    if (!guruId) return json({ error: "bad_request", message: "guru_id required" }, 400);

    // Service-role client for privileged reads/writes
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Foundation gate
    const { data: profile } = await admin
      .from("profiles")
      .select("tier_state, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) return json({ error: "no_profile", message: "Profile not found" }, 404);
    if (profile.tier_state === "foundation") {
      return json(
        { error: "foundation_required", message: "Complete Foundation to enroll with a Guru." },
        403,
      );
    }

    // Load Guru — also fetch referral_code to validate against
    const { data: guru } = await admin
      .from("guru_profiles")
      .select("id, is_public, status, referral_code, referral_discount_pct")
      .eq("id", guruId)
      .maybeSingle();
    if (!guru || !guru.is_public || guru.status !== "active") {
      return json({ error: "guru_unavailable", message: "Coach not available" }, 404);
    }

    // Default class
    const { data: classItem } = await admin
      .from("classes")
      .select("id")
      .eq("guru_id", guruId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!classItem) {
      return json({ error: "no_class", message: "Coach has not set up a class yet." }, 400);
    }

    // Verify Stripe subscription (Pro or Expert)
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Prefer stripe_customer_id from profile (P31+); fall back to email lookup
    let customer: { id: string } | null = null;
    if (profile.stripe_customer_id) {
      try {
        const c = await stripe.customers.retrieve(profile.stripe_customer_id);
        if (c && !(c as { deleted?: boolean }).deleted) {
          customer = { id: (c as { id: string }).id };
        }
      } catch (e) {
        log("stripe_customer_id retrieve failed, falling back to email", String(e));
      }
    }
    if (!customer) {
      log("WARN: falling back to email lookup for stripe customer", { email: user.email });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        return json(
          {
            error: "no_subscription",
            message: "Active Pro or Expert subscription required to enroll with a Coach.",
          },
          402,
        );
      }
      customer = { id: customers.data[0].id };
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 20,
    });

    const matched = subs.data.find((s) =>
      s.items.data.some((it) => it.price.id === proPriceId || it.price.id === expertPriceId)
    );

    if (!matched) {
      return json(
        {
          error: "no_subscription",
          message: "Active Pro or Expert subscription required to enroll with a Coach.",
        },
        402,
      );
    }
    const planTier = matched.items.data.find((it) => it.price.id === proPriceId)
      ? "pro"
      : "expert";
    log("subscription matched", { sub: matched.id, plan: planTier });

    // Resolve referral — validate against guru_profiles.referral_code (source of truth)
    let enrollmentType: "organic" | "referred" | "expert_trial" = "organic";
    let commissionRate: number | null = 20;
    let appliedReferralCode: string | null = null;
    let discountApplied = false;

    if (referralCode) {
      // Check: code matches this Guru's referral code on guru_profiles
      const codeMatchesGuru =
        guru.referral_code &&
        guru.referral_code.toUpperCase() === referralCode.toUpperCase();

      // Check: student hasn't already used this code
      const { data: priorUse } = await admin
        .from("class_enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (codeMatchesGuru && !priorUse) {
        enrollmentType = "referred";
        commissionRate = null; // month 1 free — no commission
        appliedReferralCode = referralCode;
        discountApplied = true;
        log("referral valid", { referralCode, guruReferralCode: guru.referral_code });
      } else {
        log("referral invalid — proceeding organic", {
          referralCode,
          guruReferralCode: guru.referral_code,
          codeMatchesGuru,
          priorUse: !!priorUse,
        });
      }
    }

    // Expert trial: Expert sub created within last 30 days + no referral code
    let trialExpiresAt: string | null = null;
    if (enrollmentType === "organic" && planTier === "expert") {
      const subCreated = new Date((matched as unknown as { created: number }).created * 1000);
      const daysSinceCreation = (Date.now() - subCreated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 30) {
        enrollmentType = "expert_trial";
        commissionRate = null; // no commission during trial
        trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        log("expert trial eligible", {
          daysSinceCreation: Math.round(daysSinceCreation),
          trialExpiresAt,
        });
      }
    }

    // Idempotency: if already active enrollment in this class, return it
    const { data: existing } = await admin
      .from("class_enrollments")
      .select("id, status")
      .eq("class_id", classItem.id)
      .eq("student_id", user.id)
      .maybeSingle();

    let enrollmentId: string;
    if (existing && existing.status === "active") {
      enrollmentId = existing.id;
      log("already enrolled", { enrollmentId });
    } else {
      const insertPayload = {
        class_id: classItem.id,
        student_id: user.id,
        enrollment_type: enrollmentType,
        referral_code: appliedReferralCode,
        commission_rate: commissionRate,
        discount_applied: discountApplied,
        status: enrollmentType === "expert_trial" ? "trial" : "active",
        stripe_subscription_id: matched.id,
        stripe_customer_id: customer.id,
        billing_starts_at:
          enrollmentType === "expert_trial" ? null : new Date().toISOString(),
        trial_expires_at: trialExpiresAt,
      };

      if (existing) {
        const { error: updErr } = await admin
          .from("class_enrollments")
          .update(insertPayload)
          .eq("id", existing.id);
        if (updErr) {
          log("update failed", updErr);
          return json({ error: "db_error", message: "Could not update enrollment" }, 500);
        }
        enrollmentId = existing.id;
      } else {
        const { data: created, error: insErr } = await admin
          .from("class_enrollments")
          .insert(insertPayload)
          .select("id")
          .single();
        if (insErr || !created) {
          log("insert failed", insErr);
          return json({ error: "db_error", message: "Could not create enrollment" }, 500);
        }
        enrollmentId = created.id;
      }
    }

    // Tag the existing subscription with attribution metadata
    await stripe.subscriptions.update(matched.id, {
      metadata: {
        ...(matched.metadata ?? {}),
        guru_id: guruId,
        enrollment_id: enrollmentId,
        enrollment_type: enrollmentType,
        commission_rate: String(commissionRate ?? ""),
        referral_code: appliedReferralCode ?? "",
        student_id: user.id,
        trial_expires_at: trialExpiresAt ?? "",
      },
    });
    log("subscription tagged", { sub: matched.id });

    // Update student's profile attribution ONLY for referred enrollments
    if (enrollmentType === "referred") {
      await admin
        .from("profiles")
        .update({
          referral_source: "referred",
          referred_by_guru_id: guruId,
        })
        .eq("user_id", user.id);

      // Apply month-1-free as a customer balance credit (negative balance = credit)
      try {
        const subItem = matched.items.data.find(
          (it) => it.price.id === proPriceId || it.price.id === expertPriceId,
        );
        const unitAmount = subItem?.price.unit_amount ?? 0;
        if (unitAmount > 0) {
          await stripe.customers.createBalanceTransaction(customer.id, {
            amount: -unitAmount, // negative = credit toward future invoices
            currency: subItem?.price.currency ?? "usd",
            description: `Coach referral credit (${appliedReferralCode}) — first month free`,
          });
          log("balance credit applied", { amount: unitAmount });
        }

        // Mark referral as redeemed in guru_referrals if a row exists for this code
        await admin
          .from("guru_referrals")
          .update({
            redeemed_at: new Date().toISOString(),
            referred_user_id: user.id,
            stripe_subscription_id: matched.id,
            status: "redeemed",
          })
          .eq("referral_code", appliedReferralCode!)
          .eq("guru_id", guruId);
      } catch (creditErr) {
        // Don't fail enrollment if credit fails — log and continue
        log("balance credit error (non-fatal)", String(creditErr));
      }
    }

    return json({
      success: true,
      enrollment_id: enrollmentId,
      class_id: classItem.id,
      plan: planTier,
      enrollment_type: enrollmentType,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", msg);
    return json({ error: "internal", message: "Enrollment failed. Please try again." }, 500);
  }
});
