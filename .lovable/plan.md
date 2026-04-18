

## Goal
Enable Lovable's built-in Stripe payments so you have a sandbox environment to test checkout flows (specifically for P29 cohort enrollment).

## Why built-in Stripe (not BYOK)
- **No Stripe account needed** — sandbox is created instantly
- **No API keys to manage** — Lovable handles credentials
- **Real test environment** — use Stripe test cards (4242 4242 4242 4242) end-to-end
- **Same code path as live** — flip to live later without rewriting

I am NOT recommending the bring-your-own-key Stripe integration. The built-in flow is better unless you specifically need to use your own existing Stripe account.

## Why Stripe (not Paddle)
For your use case Stripe fits better because:
- Coaching/cohort marketplaces with payouts to third-party Gurus (P29's referral_discount_pct, eventual revenue share) work cleanly with Stripe
- You keep control over tax handling and can layer Stripe Tax on later
- Paddle as Merchant of Record adds friction for marketplace-style flows

## Prerequisites (already met)
- ✅ Lovable Cloud is enabled (Supabase backend in place)
- ⚠️ **Pro plan required** — payments needs Pro or higher. If you're not on Pro, the enable step will surface that.

## What enabling does
1. Provisions a Stripe sandbox tied to your project
2. Wires Stripe credentials as runtime secrets for edge functions
3. Unlocks `batch_create_product` so I can create your products/prices
4. Gives you knowledge files for checkout + webhook implementation

**Nothing changes in your codebase** from the enable step alone — no edge functions, no checkout pages yet. Those come in P29 when we wire cohort enrollment.

## Recommended sequence
1. **Now:** Enable Stripe sandbox (1 tool call, you confirm)
2. **Later (P29):** Create cohort products/prices, build the "Join Cohort" checkout flow that's currently disabled, wire the webhook to flip `cohort_enrollments.status` to `active`
3. **Pre-launch:** Verify your Stripe account → flip sandbox to live

## What I need from you to proceed
Just a confirmation. Once you say go, I'll call `enable_stripe_payments` and Lovable will provision the sandbox.

