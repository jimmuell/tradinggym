## COACH-AGENT v1 (stubbed) — chat panel on `BacktestTeachPanel`

Goal: add a chat coach to the teaching card. Wire the full data path and UI now; keep the model swap as a one-line change later. The reply is hardcoded but must echo two real grounding values from the run to prove the context arrived.

### Scope (additive only)
- Existing static card message in `src/components/backtesting/BacktestTeachPanel.tsx` is untouched.
- No engine change. No DB migration. No changes to `run-backtest` or `results_detail` shape.

### New edge function: `coach-agent`

Location: `supabase/functions/coach-agent/index.ts`.

Request body (validated with Zod):
```ts
{
  context: {
    run_id: string,
    teaching: {                     // from results_detail._teaching[0..n], the 'stop' entry
      dimension: string,
      delta_net: number,
      direction: 'saved'|'cost'|'neutral'|string,
      significance: 'saved'|'cost'|'inconclusive'|string,
      primary_worst_loss: number,
      variant_worst_loss: number,
      trade_count: number,
      delta_ci_low: number,
      delta_ci_high: number,
      sufficient_data: boolean,
    },
    same_signal: boolean,
    kpis: { net_pnl?: number, win_rate?: number, max_drawdown?: number, ... }, // whatever the card shows
    card_message: string,           // the exact static text the card rendered
  },
  messages: Array<{ role: 'user'|'assistant', content: string }>
}
```

Auth + gating (both must pass; never trust the client):
1. `getClaims(token)` → must succeed.
2. Look up `profiles.plan_state` for `auth.uid()`. Allow `pro | expert | guru | admin` OR `profiles.role = 'admin'`. Otherwise 403.

Handler shape:
```ts
async function generateCoachReply(context, messages): Promise<string> {
  // Stage 1 (this prompt): hardcoded placeholder. Stage 2 swaps ONLY this body.
  const sig = context.teaching.significance;
  const worstWith = context.teaching.primary_worst_loss;
  return `[coach placeholder] I received this run's teaching data — significance: "${sig}", worst loss with your stop: $${Math.abs(worstWith).toFixed(2)}. Real coach replies arrive in the next release.`;
}
```

Response: `{ reply: string }`.

Notes:
- The function recomputes nothing — it only reads `context`.
- No advice/prediction language even in placeholder copy.
- CORS via `npm:@supabase/supabase-js@2/cors`.
- Single source of model-boundary code: `generateCoachReply`. Stage 2 changes ONLY that function body (Claude call via `ANTHROPIC_API_KEY`, already in secrets).

### Frontend: chat panel inside the existing card

Edit `src/components/backtesting/BacktestTeachPanel.tsx`:

1. Keep all existing static-message rendering as-is (Guards 1–3 and the saved/cost/unknown branches).
2. After the static message paragraph(s) in each render branch that has real teaching (`saved`, `cost`, `inconclusive`), append `<CoachChat run={run} context={...} />`. Skip on the "broken comparison" and "not enough data" branches.
3. New component `src/components/backtesting/CoachChat.tsx`:
   - Hook `useUserRole()` + `useTier()` to compute `canCoach = isAdmin || planState in {pro, expert, guru, admin}`. If false → render a small locked state ("Upgrade to Pro to chat with the coach") and no input.
   - Local state: `messages: {role, content}[]`, `input`, `sending`.
   - Render message list (assistant rows plain text on card surface, user rows with `bg-primary text-primary-foreground` rounded bubble — per chat UI contract).
   - `<form>` with a `<Textarea>` and a small send `<Button>` (icon). Disable while `sending`. Auto-focus input on mount and after each reply.
   - On submit: append user msg, call `supabase.functions.invoke('coach-agent', { body: { context, messages: nextMessages } })`. Append `{role:'assistant', content: data.reply}`. On error → toast.
   - Context built from `run` + the same `t` teaching entry + the headline `card_message` string already computed in `BacktestTeachPanel`. Pass `card_message` and `kpis` (read from `run.results_detail` / top-level fields like `net_pnl`, `win_rate`, `max_drawdown`) in as props.

4. No new route. No DB writes. Conversation lives in component state only (resets when card unmounts).

### Files touched

- New: `supabase/functions/coach-agent/index.ts`
- New: `src/components/backtesting/CoachChat.tsx`
- Edit: `src/components/backtesting/BacktestTeachPanel.tsx` (compute `kpis` + `card_message`, render `<CoachChat>` below each real teaching branch)

### Deploy + verify

1. Deploy `coach-agent` edge function (manual step via the deploy tool — Lovable Cloud auto-deploys it on file creation but I'll trigger explicitly to be sure).
2. Publish the Lovable build (user clicks Publish or via tool).
3. On `keen-chart-clone.lovable.app` (live site, not editor):
   - Log in as `admin@gmail.com`, open a backtest run that has a configured stop and a `_teaching` payload.
   - Confirm static card text is unchanged.
   - Confirm chat panel renders below static text.
   - Send "what did my stop do?" → reply contains `[coach placeholder]`, the significance string, and the with-stop worst loss.
4. Log in as a `starter`-plan user (or temporarily set plan to starter) → chat panel shows the locked CTA, input hidden.
5. `curl` the edge function with a bogus JWT → 401. With a starter user JWT → 403.

### Acceptance criteria mapping

- Chat renders below static message: covered by item 2 above.
- Reply quotes `significance` + worst-loss-with-stop: covered by `generateCoachReply`.
- Non-Pro blocked in UI and function: `CoachChat` gate + `plan_state` check.
- Static message untouched: only additions in `BacktestTeachPanel.tsx`.
- Single model boundary: `generateCoachReply` is the only place to swap in stage 2.

### Out of scope

- Real LLM call (stage 2).
- Persisting conversation across reloads.
- Streaming (stage 2 may add it; v1 is one-shot).
- Threaded history / multiple coach conversations.
