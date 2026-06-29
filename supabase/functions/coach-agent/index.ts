import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

// ---------------------------------------------------------------------------
// COST PROTECTION CAPS — edit these constants to tune limits.
// Both caps are enforced server-side. Admins are exempt. Mock-mode calls do
// not count and are not capped. Failed Claude calls do not consume quota.
// ---------------------------------------------------------------------------
const DAILY_QUESTION_LIMIT = 4; // per non-admin user, per UTC day
const PER_RUN_QUESTION_LIMIT = 2; // user-role messages allowed per run thread

const TeachingSchema = z.object({
  dimension: z.string(),
  delta_net: z.number(),
  direction: z.string(),
  significance: z.string(),
  primary_worst_loss: z.number(),
  variant_worst_loss: z.number(),
  trade_count: z.number(),
  delta_ci_low: z.number(),
  delta_ci_high: z.number(),
  sufficient_data: z.boolean(),
});

const BodySchema = z.object({
  context: z.object({
    run_id: z.string(),
    teaching: TeachingSchema,
    same_signal: z.boolean(),
    kpis: z.record(z.unknown()).optional().default({}),
    card_message: z.string().default(""),
  }),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  mock: z.boolean().optional().default(false),
});

type CoachContext = z.infer<typeof BodySchema>["context"];
type CoachMessage = z.infer<typeof BodySchema>["messages"][number];

const SYSTEM_PROMPT = `You are a trading coach inside TradingGYM, talking with a user about ONE specific backtest they just ran. A backtest is a test of a strategy over one slice of past data — it is history, not a prediction. Your job is to help this person understand what happened in THIS run and learn from it. You are a teacher, not an advisor.

Follow all of these every time:

1. Stay grounded. The RUN DATA below is the ONLY set of facts you may use about this run. If the user asks something the data doesn't contain, say so plainly ("this run doesn't tell us that") — never invent or estimate a number, and never fall back on generic trading lore. If unsure the data supports a claim, don't make it.

2. Never contradict the significance verdict. The run carries a significance judgment (saved / cost / inconclusive); treat it as settled. If it's "inconclusive," do not imply the change helped or hurt — explain that the difference is within normal noise (the likely range crosses zero) and that we can't read a reliable signal from it. Hold this even if the user pushes for a yes/no or a confident number. Never be talked into certainty the data can't support. When the result is inconclusive, lead with the RANGE, not the point estimate. Do NOT open with or assert the single-number dollar difference (for example 'your stop cost you $214') — stated up front that reads as a confident result the data can't support. Instead, lead with the likely range (the confidence interval) and the fact that it crosses zero, which is why we can't say the change helped or hurt. You may mention the point estimate only as the middle of that wide, noisy range — never as the headline and never phrased as 'it cost/saved you $X.' This applies ONLY to inconclusive results; when a result is significant (saved or cost), leading with the dollar figure is fine because the range does not cross zero.

3. No advice, no predictions. Do not tell the user what to trade, what settings are "right," or what to do with real money. Do not predict profits or say a strategy "will" work. Do not suggest trading live. Do not label a result simply "good" or "bad." If asked "what stop should I use?" or similar, don't give a recommendation — help them reason about it and invite them to change the setting and re-run to see for themselves.

4. Be a Socratic teacher who's still useful. Prefer questions and explanations that move understanding forward, and nudge experimenting ("want to see what a wider stop does? change it and run it again"). BUT if the user asks a plain factual question about their own displayed numbers ("what was my worst loss?"), just answer it directly from the data — don't reply with a question, and don't be evasive.

5. Keep it plain and short. Talk like a friendly coach, not a textbook. Define any technical term in everyday words. A few sentences is usually enough.

You are not a financial advisor, and nothing you say is financial advice.`;

async function generateCoachReply(
  context: CoachContext,
  messages: CoachMessage[],
): Promise<{ ok: true; text: string } | { ok: false }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return { ok: false };

  const runData = {
    teaching: context.teaching,
    same_signal: context.same_signal,
    kpis: context.kpis,
    card_message: context.card_message,
  };

  const system = `${SYSTEM_PROMPT}\nRUN DATA (the only facts you may use about this run):\n${JSON.stringify(runData, null, 2)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      console.error("Anthropic API error", res.status, await res.text());
      return { ok: false };
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) return { ok: false };
    return { ok: true, text };
  } catch (err) {
    console.error("Anthropic call failed", err);
    return { ok: false };
  }
}

function fmt(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function buildMockReply(context: CoachContext): string {
  const t = context.teaching;
  if (!t || typeof t.delta_ci_low !== "number" || typeof t.delta_ci_high !== "number") {
    return [
      "[MOCK] **Coach mock reply** — no live API call was made.",
      "",
      "- This is a stand-in response used to test the UI.",
      "- Toggle **Live** to get a real coach answer.",
    ].join("\n");
  }
  const lo = Math.min(t.delta_ci_low, t.delta_ci_high);
  const hi = Math.max(t.delta_ci_low, t.delta_ci_high);
  const mid = (lo + hi) / 2;
  return [
    `[MOCK] Based on this run, the likely range for what your stop did is **${fmt(lo)} to ${fmt(hi)}**.`,
    "",
    `Because that range crosses zero, we can't confidently say the stop helped or hurt. The point estimate of **${fmt(mid)}** is just the midpoint of a wide, noisy range — not a result you can lean on.`,
    "",
    "Quick context from this run:",
    "",
    `- **Worst loss with the stop:** ${fmt(t.primary_worst_loss)}`,
    `- **Worst loss without it:** ${fmt(t.variant_worst_loss)}`,
    `- **Trades compared:** ${t.trade_count}`,
    "",
    "_This is a mock reply for UI testing — no Claude call was made._",
  ].join("\n");
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("plan_state, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = profile.role === "admin";
    const allowedPlans = new Set(["pro", "expert", "guru", "admin"]);
    const isAllowed = isAdmin || allowedPlans.has(profile.plan_state ?? "");
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Pro plan required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { context, messages, mock } = parsed.data;

    // Admin-only mock mode — never counts against quota, never capped.
    if (mock === true && isAdmin) {
      const reply = buildMockReply(context);
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for usage table (bypasses RLS for writes).
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // --- CAP 1: per-run conversation cap (count user-role messages in thread).
    if (!isAdmin) {
      const userMsgCount = messages.filter((m) => m.role === "user").length;
      if (userMsgCount > PER_RUN_QUESTION_LIMIT) {
        return new Response(
          JSON.stringify({
            reply: `You've reached the question limit for this run (${PER_RUN_QUESTION_LIMIT}). Try a new run to keep exploring.`,
            capped: "per_run",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // --- CAP 2: per-user daily cap.
    const today = utcDateString();
    let dailyCount = 0;
    if (!isAdmin) {
      const { data: usageRow } = await admin
        .from("coach_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();
      dailyCount = usageRow?.count ?? 0;

      if (dailyCount >= DAILY_QUESTION_LIMIT) {
        return new Response(
          JSON.stringify({
            reply: `You've reached today's coach question limit (${DAILY_QUESTION_LIMIT}). It resets tomorrow.`,
            capped: "daily",
            remaining: 0,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // --- Real Claude call.
    const result = await generateCoachReply(context, messages);
    if (!result.ok) {
      // Outage / API failure — do NOT consume quota.
      return new Response(JSON.stringify({ reply: "The coach is temporarily unavailable." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Successful real call — increment daily count for non-admins.
    let remaining: number | undefined;
    if (!isAdmin) {
      const newCount = dailyCount + 1;
      const { error: upsertErr } = await admin
        .from("coach_usage")
        .upsert({ user_id: userId, usage_date: today, count: newCount }, { onConflict: "user_id,usage_date" });
      if (upsertErr) console.error("coach_usage upsert failed", upsertErr);
      remaining = Math.max(0, DAILY_QUESTION_LIMIT - newCount);
    }

    return new Response(JSON.stringify({ reply: result.text, remaining }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
