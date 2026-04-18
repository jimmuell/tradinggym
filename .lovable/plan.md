

## Goal
Connect TradingGYM to your **existing Lion Gate Technology Stripe sandbox** via Lovable's BYOK Stripe integration, so P29 cohort enrollment checkout flows can be built against the Stripe account you already own.

## Approach
Use the `stripe--enable_stripe` tool (BYOK). This:
- Stores your Stripe **secret key** as a runtime secret available to edge functions
- Does NOT create a new Stripe account
- Does NOT touch your codebase yet — no edge functions, no checkout pages
- Leaves you in control of products/prices via your existing Stripe dashboard

## What you'll need to paste
From your Lion Gate Technology sandbox dashboard → **Developers → API keys**:
- **Secret key** — starts with `sk_test_...` (the sandbox/test one, not live)

The publishable key (`pk_test_...`) is fine to commit to the codebase later when we wire the client-side checkout redirect — it's designed to be public.

Do NOT paste the live `sk_live_...` key. We want sandbox only until P29 is built and tested.

## Sequence
1. **Now:** I call `stripe--enable_stripe` → Lovable prompts you to paste the `sk_test_...` key in a secure dialog
2. **Later (P29):** Build the cohort enrollment edge function (`create-checkout-session`) that uses the stored secret to create Stripe Checkout sessions, plus a webhook handler to flip `cohort_enrollments.status` to `active` on `checkout.session.completed`
3. **Pre-launch:** Swap `sk_test_...` for `sk_live_...` and update the webhook endpoint in your Stripe live mode

## What I need from you
Just confirmation to proceed. Once you say go, I'll call the BYOK enable tool and you'll get a prompt to paste the sandbox secret key.

