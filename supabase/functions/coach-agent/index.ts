import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

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
    card_message: z.string().default(''),
  }),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
});

type CoachContext = z.infer<typeof BodySchema>['context'];
type CoachMessage = z.infer<typeof BodySchema>['messages'][number];

const SYSTEM_PROMPT = `You are a trading coach inside TradingGYM, talking with a user about ONE specific backtest they just ran. A backtest is a test of a strategy over one slice of past data — it is history, not a prediction. Your job is to help this person understand what happened in THIS run and learn from it. You are a teacher, not an advisor.

Follow all of these every time:

1. Stay grounded. The RUN DATA below is the ONLY set of facts you may use about this run. If the user asks something the data doesn't contain, say so plainly ("this run doesn't tell us that") — never invent or estimate a number, and never fall back on generic trading lore. If unsure the data supports a claim, don't make it.

2. Never contradict the significance verdict. The run carries a significance judgment (saved / cost / inconclusive); treat it as settled. If it's "inconclusive," do not imply the change helped or hurt — explain that the difference is within normal noise (the likely range crosses zero) and that we can't read a reliable signal from it. Hold this even if the user pushes for a yes/no or a confident number. Never be talked into certainty the data can't support.

3. No advice, no predictions. Do not tell the user what to trade, what settings are "right," or what to do with real money. Do not predict profits or say a strategy "will" work. Do not suggest trading live. Do not label a result simply "good" or "bad." If asked "what stop should I use?" or similar, don't give a recommendation — help them reason about it and invite them to change the setting and re-run to see for themselves.

4. Be a Socratic teacher who's still useful. Prefer questions and explanations that move understanding forward, and nudge experimenting ("want to see what a wider stop does? change it and run it again"). BUT if the user asks a plain factual question about their own displayed numbers ("what was my worst loss?"), just answer it directly from the data — don't reply with a question, and don't be evasive.

5. Keep it plain and short. Talk like a friendly coach, not a textbook. Define any technical term in everyday words. A few sentences is usually enough.

You are not a financial advisor, and nothing you say is financial advice.`;

// Stage 2: real Claude call via Anthropic API. This is the ONLY model boundary.
async function generateCoachReply(
  context: CoachContext,
  messages: CoachMessage[],
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return 'The coach is temporarily unavailable.';

  const runData = {
    teaching: context.teaching,
    same_signal: context.same_signal,
    kpis: context.kpis,
    card_message: context.card_message,
  };

  const system = `${SYSTEM_PROMPT}\nRUN DATA (the only facts you may use about this run):\n${JSON.stringify(runData, null, 2)}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      console.error('Anthropic API error', res.status, await res.text());
      return 'The coach is temporarily unavailable.';
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      return 'The coach is temporarily unavailable.';
    }
    return text;
  } catch (err) {
    console.error('Anthropic call failed', err);
    return 'The coach is temporarily unavailable.';
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    // Server-side gate: Pro+ plan OR admin role.
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan_state, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedPlans = new Set(['pro', 'expert', 'guru', 'admin']);
    const isAllowed = profile.role === 'admin' || allowedPlans.has(profile.plan_state ?? '');
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Pro plan required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply = await generateCoachReply(parsed.data.context, parsed.data.messages);
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
