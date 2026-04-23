import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXTRACT-STRATEGY] ${step}${d}`);
};

const SYSTEM_PROMPT = `You are a trading strategy analyst. You extract structured, actionable trading strategies from educational content.

Given a transcript or article about trading, extract ONE clear trading strategy and return it via the extract_strategy tool.

Rules:
- Extract concrete, actionable rules — not vague advice like "follow the trend"
- Entry and exit rules must be specific enough to be testable in a simulator
- Include at least 3 entry rules and 2 exit rules
- Checklist steps follow a two-section format: session_prep (before trading) and trade_execution (during each trade)
- Include 3-5 session_prep steps and 4-6 trade_execution steps
- If the content doesn't contain a clear strategy, set confidence to "low" and extract what you can
- If multiple strategies are discussed, extract the primary/most detailed one`;

const STRATEGY_TOOL = {
  type: "function",
  function: {
    name: "extract_strategy",
    description: "Return one structured trading strategy extracted from the provided content.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short descriptive strategy name" },
        description: { type: "string", description: "2-3 sentence summary" },
        instrument: { type: "string", description: "e.g. ES, MES, NQ, SPY, or 'Any'" },
        timeframe: { type: "string", description: "e.g. 5m, 15m, 1h, 4h, Daily, or 'Any'" },
        direction_bias: { type: "string", enum: ["long_only", "short_only", "both"] },
        entry_rules: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
        },
        exit_rules: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
        },
        checklist_steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string", enum: ["session_prep", "trade_execution"] },
              label: { type: "string" },
              is_core: { type: "boolean" },
            },
            required: ["section", "label", "is_core"],
            additionalProperties: false,
          },
        },
        notes: { type: "string" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: [
        "name",
        "description",
        "instrument",
        "timeframe",
        "direction_bias",
        "entry_rules",
        "exit_rules",
        "checklist_steps",
        "notes",
        "confidence",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "AI gateway not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub;

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON body" }, 400);

    const text = typeof body.text === "string" ? body.text : "";
    const sourceType = typeof body.source_type === "string" ? body.source_type : "notes";

    if (text.trim().length < 100) {
      return json({ error: "Text too short to extract a strategy" }, 400);
    }
    if (text.length > 50000) {
      return json({ error: "Text exceeds maximum length (50,000 characters)" }, 400);
    }

    // Plan gate — Pro+ only
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("plan_state")
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile) return json({ error: "Profile not found" }, 404);
    if (profile.plan_state === "starter") {
      return json({ error: "Pro plan required to use AI extraction" }, 403);
    }

    log("Calling AI gateway", { userId, sourceType, length: text.length });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Source type: ${sourceType}\n\nContent:\n${text}`,
          },
        ],
        tools: [STRATEGY_TOOL],
        tool_choice: { type: "function", function: { name: "extract_strategy" } },
      }),
    });

    if (aiResp.status === 429) {
      return json({ error: "Rate limit exceeded. Please try again shortly." }, 429);
    }
    if (aiResp.status === 402) {
      return json({ error: "AI credits exhausted. Please add credits in workspace settings." }, 402);
    }
    if (!aiResp.ok) {
      const errText = await aiResp.text();
      log("AI gateway error", { status: aiResp.status, errText });
      return json({ error: "AI extraction failed — please try again" }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      log("Missing tool call", aiJson);
      return json({ error: "AI extraction failed — please try again" }, 502);
    }

    let strategy;
    try {
      strategy = JSON.parse(argsStr);
    } catch (e) {
      log("Failed to parse tool args", { argsStr });
      return json({ error: "AI extraction failed — please try again" }, 502);
    }

    // Basic shape validation
    if (
      !strategy.name ||
      !Array.isArray(strategy.entry_rules) ||
      !Array.isArray(strategy.exit_rules) ||
      !Array.isArray(strategy.checklist_steps)
    ) {
      return json({ error: "AI extraction returned invalid shape" }, 502);
    }

    const tokensUsed = aiJson?.usage?.total_tokens ?? 0;

    return json({
      strategy,
      tokens_used: tokensUsed,
      source_type: sourceType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    log("Unexpected error", { msg });
    return json({ error: msg }, 500);
  }
});
