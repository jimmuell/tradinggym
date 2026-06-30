## Goal
Hide the interactive "Ask the coach" chat from regular users for launch while keeping the static teaching card visible. Admins keep access for demos. All coach code (prompt, rate-limit, fail-safe, mock toggle, edge function) stays in place — gated, not deleted.

## Feature flag

Add a single flag `COACH_CHAT_ENABLED` (default `false`).

- **Client:** `src/lib/featureFlags.ts` exporting `export const COACH_CHAT_ENABLED = false;` — a constant, since we have no remote-config table today. Flipping requires a one-line code change (no rebuild of unrelated logic). Noted as the trade-off; if we want flip-without-deploy later, we can move it to a `feature_flags` table.
- **Server:** `Deno.env.get("COACH_CHAT_ENABLED") === "true"` in the edge function, defaulting to `false`. Can be flipped via the function's environment variable without redeploying code (still requires the deploy action to set the var the first time).

## Client changes

**`src/components/backtesting/BacktestTeachPanel.tsx`**
- Import `COACH_CHAT_ENABLED`.
- Compute `showCoach = COACH_CHAT_ENABLED || isAdmin`.
- When `showCoach` is false:
  - Do not render `<CoachChat />` in any of the three branches (inconclusive / saved / cost).
  - Do not render the admin Live/Mock toggle (`adminToggle` only meaningful when chat renders; admins still see it because `isAdmin` keeps `showCoach` true).
- Static card content (verdict line, worst-loss line, caption) is untouched in every branch.

No changes to `CoachChat.tsx` itself — it simply isn't mounted for regular users.

## Server changes

**`supabase/functions/coach-agent/index.ts`**
- Read `const COACH_CHAT_ENABLED = Deno.env.get("COACH_CHAT_ENABLED") === "true";` at module scope.
- After auth + admin lookup, before rate-limit / Anthropic call:
  ```
  if (!COACH_CHAT_ENABLED && !isAdmin) {
    return new Response(
      JSON.stringify({ reply: "The coach is not available yet — coming soon.", disabled: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  ```
  Returning 200 with a clean assistant-style message avoids the fail-safe "Coach is unavailable" error bubble. Admins and mock-mode admin calls bypass the gate.
- Rate-limit, guardrail prompt, mock toggle, fail-safe — all preserved untouched below the gate.

## Deploy
- Edge function requires manual redeploy after the edit (per `docs/DEPLOY_WORKFLOW.md`). I'll request that explicitly after applying.
- No DB migration. No secret required (env var is optional; absent = disabled, which is the desired launch default).

## Verification
1. Regular Pro user on `/backtesting` with a stop > 0: static "What your stop did" card renders; no chat input, no Send button, no "N left today", no admin toggle.
2. Admin user: chat renders and works (Live + Mock).
3. `curl` (or invoke) `coach-agent` as a non-admin: returns the clean "coming soon" reply, no Anthropic call (verify via function logs — no outbound request, no usage increment).
4. Static card text and KPIs unchanged across all three significance branches.

## Re-enabling later
- Set `COACH_CHAT_ENABLED = true` in `src/lib/featureFlags.ts` AND set the `COACH_CHAT_ENABLED=true` env var on the edge function. Behavior reverts to today's Pro+/admin gated chat with rate limits.
