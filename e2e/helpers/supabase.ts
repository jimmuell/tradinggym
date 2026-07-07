import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";

// Read a VITE_SUPABASE_* value straight from .env (the app config isn't on process.env for the
// test runner). Used to build an authed supabase-js client for server-truth assertions.
function envVal(name: string): string {
  for (const p of [".env.local", ".env"]) {
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error(`missing ${name} in .env`);
}

const SUPABASE_URL = envVal("VITE_SUPABASE_URL");
const SUPABASE_KEY = envVal("VITE_SUPABASE_PUBLISHABLE_KEY");

// A supabase-js client signed in as the given account — the SAME client the app uses, so RLS and
// RPC behave exactly as in production. Used for the server-truth checks (profiles.tier_state, the
// RLS-guarded update attempt, and graduate_foundation), which are the authoritative half of this
// guard (the DOM only reflects them).
export async function authedClient(
  email: string,
  password: string,
): Promise<{ sb: SupabaseClient; uid: string }> {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`authedClient login failed for ${email}: ${error?.message}`);
  return { sb, uid: data.user.id };
}
