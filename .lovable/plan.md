Audit result: `RESEND_API_KEY` is **not used to send email** anywhere in the project.

Current email flow:
- `supabase/functions/auth-email-hook/index.ts` parses auth webhooks and calls `supabase.rpc('enqueue_email', ...)`.
- `supabase/functions/process-email-queue/index.ts` drains the queue using `sendLovableEmail` from `@lovable.dev/email-js`.
- No edge function imports `resend` or `@resend/*`.
- `package.json` has no `resend` dependency.

The only places the string `RESEND_API_KEY` appears are dead references:
1. `src/pages/admin/AdminConfigPage.tsx:54` — a read-only reference list of managed secrets shown in the admin UI.
2. `supabase/functions/get-admin-secret/index.ts:21` — the allow-list of secret names an admin can query.

Plan:
1. Remove the `RESEND_API_KEY` entry from `AdminConfigPage.tsx` managed-secrets list.
2. Remove `"RESEND_API_KEY"` from the `ALLOWED` set in `get-admin-secret/index.ts`.
3. Verify no other `RESEND`/`resend` references remain in the codebase.

After that, the secret can be safely deleted from project secrets — nothing in the code will miss it.