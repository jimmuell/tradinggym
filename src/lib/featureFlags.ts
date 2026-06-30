// Feature flags for staged rollout.
//
// COACH_CHAT_ENABLED — gates the interactive "Ask the coach" chat on the
// BacktestTeachPanel. When false, the static teaching card still renders for
// everyone, but the chat (input, send, message thread, counter, admin
// Live/Mock toggle) is hidden from regular users. Admins always see the chat
// for demos/testing regardless of this flag.
//
// Server-side gate lives in supabase/functions/coach-agent/index.ts and is
// controlled by the COACH_CHAT_ENABLED edge function env var (defaults off).
// Flip both to re-enable the coach for all eligible users.
export const COACH_CHAT_ENABLED = false;
