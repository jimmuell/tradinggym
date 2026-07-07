// Mints short-lived signed URLs for guru-class media stored in the private
// bucket `lesson-assets-private`. Entitlement is checked via the SECURITY
// DEFINER function public.can_access_guru_asset(_user_id, _path).
//
// TTL: 300 seconds. Rotation in the client happens well before expiry.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const PathSchema = z
  .string()
  .min(1)
  .max(512)
  .refine((p) => !p.includes('..'), 'path traversal not allowed')
  .refine((p) => !p.startsWith('/'), 'leading slash not allowed')
  .refine((p) => !/[\s\x00-\x1f]/.test(p), 'whitespace or control character not allowed')
  .refine((p) => !p.includes('\\'), 'backslash not allowed');

const BodySchema = z.object({
  paths: z.array(PathSchema).min(1).max(50),
});

const TTL_SECONDS = 300;
const BUCKET = 'lesson-assets-private';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify JWT signature and get the caller's user id from the claims.
  const authClient = createClient(supabaseUrl, anonKey);
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Deduplicate to avoid double signing.
  const paths = Array.from(new Set(parsed.data.paths));

  const serviceClient = createClient(supabaseUrl, serviceKey);

  const signed: Record<string, { url: string; expiresAt: number }> = {};
  const denied: string[] = [];
  const nowSec = Math.floor(Date.now() / 1000);

  await Promise.all(
    paths.map(async (path) => {
      const { data: allowed, error: rpcError } = await serviceClient.rpc(
        'can_access_guru_asset',
        { _user_id: userId, _path: path },
      );
      if (rpcError) {
        console.error('can_access_guru_asset failed', { path, error: rpcError.message });
        denied.push(path);
        return;
      }
      if (allowed !== true) {
        denied.push(path);
        return;
      }
      const { data: signedData, error: signError } = await serviceClient.storage
        .from(BUCKET)
        .createSignedUrl(path, TTL_SECONDS);
      if (signError || !signedData?.signedUrl) {
        console.error('createSignedUrl failed', { path, error: signError?.message });
        denied.push(path);
        return;
      }
      signed[path] = {
        url: signedData.signedUrl,
        expiresAt: (nowSec + TTL_SECONDS) * 1000,
      };
    }),
  );

  return new Response(JSON.stringify({ signed, denied }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
