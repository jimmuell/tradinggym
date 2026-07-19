// request-password-reset — generates a recovery link via admin.generateLink
// and enqueues it through the existing pgmq email pipeline. Bypasses
// Supabase's send path (which does not expose token_hash to our email hook
// on this platform) while reusing the verified render+queue+dispatch stack.
//
// Rate limits (enforced here, since we go around Supabase's own limits):
//   - per address: max 1 request per 60 seconds
//   - per address: max 5 requests per hour
//   - global:      max 60 recovery sends per hour (backstop below the
//                  workspace 100/hour cap)
// All limits are enforced by counting rows in public.email_send_log where
// template_name = 'recovery' inside the relevant window. On throttle we
// return the SAME neutral response as success, and write a `throttled` row
// to email_send_log so the outcome is visible server-side. The send log has
// multiple rows per email (pending → sent), so rate limits must count unique
// message_id values, not raw rows.

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'TradingGYM'
const SITE_URL = 'https://keen-chart-clone.lovable.app'
const SENDER_DOMAIN = 'notify.tradinggym.app'
const FROM_DOMAIN = 'tradinggym.app'

const PER_ADDRESS_COOLDOWN_SEC = 60
const PER_ADDRESS_HOURLY_CAP = 5
const GLOBAL_HOURLY_CAP = 60

const NEUTRAL_BODY = JSON.stringify({
  ok: true,
  message: "If an account exists for that email, we've sent a reset link.",
})

function neutralResponse(): Response {
  return new Response(NEUTRAL_BODY, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    // Never leak parse errors; treat as neutral success.
    return neutralResponse()
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return neutralResponse()
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const now = Date.now()
  const oneMinAgo = new Date(now - 60_000).toISOString()
  const oneHourAgo = new Date(now - 3_600_000).toISOString()

  const recordThrottle = async (reason: string) => {
    try {
      const { error } = await supabase.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'recovery',
        recipient_email: email,
        status: 'failed',
        error_message: `throttled: ${reason}`,
      })
      if (error) console.error('[request-password-reset] throttle log failed', error)
    } catch (err) {
      console.error('[request-password-reset] throttle log crashed', err)
    }
  }

  const countUniqueAttempts = async (scope: 'address' | 'global', since: string) => {
    let query = supabase
      .from('email_send_log')
      .select('message_id')
      .eq('template_name', 'recovery')
      .in('status', ['pending', 'sent'])
      .gte('created_at', since)

    if (scope === 'address') query = query.eq('recipient_email', email)

    const { data, error } = await query.limit(500)
    if (error) {
      console.error('[request-password-reset] rate-limit query failed', { scope, error })
      // Fail closed but visible: do not send while the limiter is blind.
      await recordThrottle(`rate-limit query failed for ${scope}`)
      return Number.POSITIVE_INFINITY
    }

    return new Set((data ?? []).map((row) => row.message_id).filter(Boolean)).size
  }

  const [perAddrRecent, perAddrHour, globalHour] = await Promise.all([
    countUniqueAttempts('address', oneMinAgo),
    countUniqueAttempts('address', oneHourAgo),
    countUniqueAttempts('global', oneHourAgo),
  ])

  if ((perAddrRecent ?? 0) >= 1) {
    await recordThrottle(`per-address cooldown ${PER_ADDRESS_COOLDOWN_SEC}s`)
    return neutralResponse()
  }
  if ((perAddrHour ?? 0) >= PER_ADDRESS_HOURLY_CAP) {
    await recordThrottle(`per-address hourly cap ${PER_ADDRESS_HOURLY_CAP}`)
    return neutralResponse()
  }
  if ((globalHour ?? 0) >= GLOBAL_HOURLY_CAP) {
    await recordThrottle(`global hourly cap ${GLOBAL_HOURLY_CAP}`)
    return neutralResponse()
  }

  // Ask Supabase only for the LINK. Do not use the returned action_link
  // (that's the /auth/v1/verify form we're avoiding); build our own from
  // hashed_token (aka token_hash) so it lands directly on /reset-password.
  const { data: genData, error: genError } = await (supabase.auth.admin as any)
    .generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/reset-password` },
    })

  if (genError) {
    const msg = String(genError.message || '').toLowerCase()
    // Unknown user → neutral success (do not leak existence).
    if (msg.includes('user not found') || msg.includes('not found')) {
      return neutralResponse()
    }
    console.error('[request-password-reset] generateLink failed', genError)
    try {
      await supabase.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'recovery',
        recipient_email: email,
        status: 'failed',
        error_message: `generateLink error: ${String(genError.message).slice(0, 400)}`,
      })
    } catch (_) { /* swallow */ }
    return neutralResponse()
  }

  const props = (genData?.properties ?? genData?.data?.properties ?? {}) as Record<string, unknown>
  const tokenHash =
    (props.hashed_token as string | undefined) ??
    (props.token_hash as string | undefined) ??
    (genData?.hashed_token as string | undefined)

  if (!tokenHash) {
    console.error('[request-password-reset] generateLink returned no token_hash', {
      propKeys: Object.keys(props),
    })
    try {
      await supabase.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'recovery',
        recipient_email: email,
        status: 'failed',
        error_message: 'generateLink returned no token_hash — platform cannot support token_hash flow',
      })
    } catch (_) { /* swallow */ }
    // Neutral to the client; server log tells the real story.
    return neutralResponse()
  }

  const confirmationUrl = `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`

  const html = await renderAsync(
    React.createElement(RecoveryEmail, { siteName: SITE_NAME, confirmationUrl }),
  )
  const text = await renderAsync(
    React.createElement(RecoveryEmail, { siteName: SITE_NAME, confirmationUrl }),
    { plainText: true },
  )

  const messageId = crypto.randomUUID()

  // Log pending BEFORE enqueue so the row exists even if enqueue crashes.
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'recovery',
    recipient_email: email,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    // This is initiated by the app, not by the platform auth-email hook, so
    // there is no valid email API run_id. Use the app-email queue contract:
    // purpose + idempotency_key and no fabricated run_id.
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      idempotency_key: `password-reset-${messageId}`,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Reset your password',
      html,
      text,
      purpose: 'transactional',
      label: 'recovery',
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('[request-password-reset] enqueue failed', enqueueError)
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'recovery',
      recipient_email: email,
      status: 'failed',
      error_message: `enqueue failed: ${String(enqueueError.message).slice(0, 400)}`,
    })
    return neutralResponse()
  }

  console.log('[request-password-reset] enqueued recovery via token_hash link')
  return neutralResponse()
})
