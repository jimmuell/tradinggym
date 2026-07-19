
## Forgot-password hardening — build plan (v4, items 1–3 merged)

v3 approved. This revision hardens Correction 1 into a proven outcome, replaces the "genuinely expired" probe with a consumed-token probe, and locks down the setSession restore path. Everything else in v3 stands.

### A. Reset flow — `src/pages/ResetPassword.tsx`

Mount effect, with Item 3 additions in the capture + restore:

```text
mount:
  parse token_hash + type from location.search AND location.hash
  parse error + error_description from both

  if error:
    mode='error'; render error card + "Request a new reset link" -> /auth
    (existing session untouched)

  else if token_hash + type='recovery':
    // Item 3: capture BOTH tokens so a restore is functionally complete.
    const prev = await supabase.auth.getSession()
    const prevPair = prev?.data.session
      ? { access_token: prev.data.session.access_token,
          refresh_token: prev.data.session.refresh_token }
      : null

    try {
      await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
    } catch (err) {
      // Bad / consumed / expired token.
      if (prevPair) {
        // If verifyOtp mutated session, restore; if not, this is a no-op.
        const { error: restoreErr } =
          await supabase.auth.setSession(prevPair)
        if (restoreErr) {
          // Item 3: restore itself failed. Explicit terminal state.
          mode='error'
          message='Your reset link is invalid or already used, and we
                   couldn't restore your previous sign-in. Please sign in
                   again.'
          renderErrorCard + link to /auth
          return
        }
      }
      mode='error'
      message=server text (verbatim) + "Request a new link" -> /auth
      return
    }

    // Token valid — verifyOtp has set the recovery session locally.
    // Correction 1 (Item 1): the cross-browser probe (section D probe 3)
    // decides whether a local-scope signOut is needed here. Two branches
    // wired at build time, chosen by the probe result:
    //
    //   PROBE PASS  -> no extra signOut. verifyOtp swapped local storage
    //                  only; other devices of the previous user are safe.
    //   PROBE FAIL  -> insert `await supabase.auth.signOut({ scope: 'local' })`
    //                  BEFORE verifyOtp, on a mount branch that also captures
    //                  prevPair. Never global.
    //
    // The report states which branch shipped and why.

    mode='recovery'
    verifiedEmail = current session user email
    render form "Set a new password" / "for <verifiedEmail>"

  else if existing session:
    mode='change'   // current-password required, capped, ADD-2 global signOut on success

  else:
    mode='error'
```

Global-scope sign-out remains only in the two owner-driven paths (successful recovery reset, successful in-session change).

### B. Section D — LIVE PROBES (three, per Item 1 + Item 2)

Probe 1. **Failed re-auth leaves the caller's session intact.**
Sign in, submit a wrong current password on the change form, then hit `getSession()` and a session-scoped call (e.g. an RLS-guarded read). Session must still be the caller's.

Probe 2. **Consumed-recovery-link does NOT sign the caller out.** (Item 2)
Request a fresh reset for account X while signed in as X. Click the emailed link once (verifies successfully; complete or abandon the form — irrelevant). Then click the SAME link again in a signed-in browser as X. The second click produces the same `otp_expired` / `One-time token not found` failure seen in the 2026-07-19 logs. Confirm the caller's session is still valid via a session-scoped call. Report clearly this was a CONSUMED token, not a time-expired one (item 18).

Probe 3. **Cross-browser: recovery for B in browser 1 must not sign A out of browser 2.** (Item 1)
- Browser 1: sign in as A. Browser 2 (separate profile / private window / second machine): sign in as A. Confirm both sessions live via a session-scoped call from each.
- Browser 1: open a fresh, valid recovery link for a different user B (paste the URL). Let verifyOtp succeed.
- Browser 2: within seconds, call a session-scoped endpoint. PASS = still works; FAIL = signed out.
- Ship the "no extra signOut" branch on PASS. Ship the explicit `signOut({ scope: 'local' })` branch on FAIL. Report the raw observation, not the expectation (item 17).

Account choice — probes 1 and 2 use the change/reset flow under Settings, reachable regardless of Foundation status. Confirm reachability with `expert@gmail.com`; if it can't reach Settings for any reason, switch to `pro@gmail.com`. Probe 3 needs two accounts — I'll use A = `expert@gmail.com` (or Pro if Expert can't reach), B = a throwaway seed account whose reset can be safely triggered. Report which accounts and browsers (item 16).

### C. Attempt cap (unchanged from v3)

`sessionStorage["pw_reauth_attempts:<user_id>"]`, cap 3, cleared on success. Server rate limit is the real backstop.

### D. Terminal error states (Item 3)

Every failure branch in `/reset-password` must resolve to one of exactly two rendered states: the form (with a specific mode) or the error card (with a specific human message + link to `/auth`). No spinner, no blank. This includes:
- Recovery token invalid/expired/consumed → error card (server text + retry link).
- Recovery token invalid AND session restore failed → error card with the Item-3 wording, link to `/auth`.
- Missing token, no session → error card.
- verifyOtp network failure → error card (retryable message).

### E. In-session change surfaces, emails (B4), swallowed-error audit (B5), 60-min reconciliation (B6), Amendment 1 cause statement, Playwright updates

All unchanged from v3.

### Verification (published host) — key deltas

3. Cross-browser probe 3 as above — observation, not expectation.
6. Consumed-link probe 2 — signed-in caller stays signed in.
7. Attempt cap survives page refresh; new tab starts fresh (documented).
8. Deliberate setSession-failure sanity check (e.g. clear tokens between capture and restore) → user sees the Item-3 terminal error card, not a spinner.

### Report-back (19 items)

1–10. Unchanged from v3.
11. Recovery over a different signed-in user + form names account.
12. In-session change signs out all sessions + exact wording.
13. Attempt cap + probe-1 evidence.
14. Local-scope confirmation for the pre-verify path (if any); global only after successful password change.
15. Signed-in expired-link → original session intact + probe evidence + any restore code path taken.
16. Which test accounts + browsers used.
17. **Item 1:** cross-browser probe result — raw observation from a session-scoped endpoint in browser 2.
18. **Item 2:** whether the "expired" probe used a CONSUMED token or a genuinely time-expired one.
19. **Item 3:** what the user sees if the session restore itself fails — exact rendered copy and navigation target.

### Explicitly NOT changing

No `configure_auth`, HIBP toggle, redirect-URL edit, `MAILER_OTP_EXP` change, queue/cron/RLS/schema work, or prior watchdog changes.
