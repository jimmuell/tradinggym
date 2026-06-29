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

// Stage 1: hardcoded placeholder. Stage 2 replaces ONLY this function body
// with a real model call. Nothing else in this file should need to change.
async function generateCoachReply(
  context: CoachContext,
  _messages: CoachMessage[],
): Promise<string> {
  const sig = context.teaching.significance;
  const worstWith = context.teaching.primary_worst_loss;
  const amount = `$${Math.abs(worstWith).toFixed(2)}`;
  return `[coach placeholder] I received this run's teaching data — significance: "${sig}", worst loss with your stop: ${amount}. Real coach replies arrive in the next release.`;
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
