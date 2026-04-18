import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomChars(n: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function buildSlug(displayName: string | null | undefined): string {
  const base = (displayName ?? "GURU")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return base.length > 0 ? base : "GURU";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing authorization" });

    // Validate JWT via anon client
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json(401, { error: "Invalid token" });
    }
    const userId = userData.user.id;

    // Service-role client for writes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Look up guru profile
    const { data: guru, error: guruErr } = await admin
      .from("guru_profiles")
      .select("id, referral_code")
      .eq("user_id", userId)
      .maybeSingle();

    if (guruErr) return json(500, { error: guruErr.message });
    if (!guru) return json(404, { error: "Guru profile not found" });

    if (guru.referral_code) {
      return json(200, { referral_code: guru.referral_code });
    }

    // Get display name from profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();

    const slug = buildSlug(profile?.display_name);

    // Try up to 5 times to generate a unique code
    let chosen: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `GURU-${slug}-${randomChars(4)}`;
      const { data: existing, error: lookupErr } = await admin
        .from("guru_profiles")
        .select("id")
        .eq("referral_code", candidate)
        .maybeSingle();
      if (lookupErr) return json(500, { error: lookupErr.message });
      if (!existing) {
        chosen = candidate;
        break;
      }
    }

    if (!chosen) {
      return json(500, { error: "Could not generate unique code" });
    }

    const { error: updateErr } = await admin
      .from("guru_profiles")
      .update({ referral_code: chosen })
      .eq("id", guru.id);

    if (updateErr) return json(500, { error: updateErr.message });

    return json(200, { referral_code: chosen });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json(500, { error: msg });
  }
});
