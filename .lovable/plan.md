Current state
- The /auth page calls `supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo: ... })` in `src/pages/Auth.tsx`. That hands the email content off to Lovable’s managed auth backend, which uses a default template.
- There is no project-owned reset-password email template yet, so there is no local code that controls the button color/text. The dark-mode visibility issue in your screenshot is in that default template.
- No sender domain is configured for this project, so custom auth templates cannot be activated yet.

Plan
1. Configure a sender domain
   - You need a domain you own (or buy one through Lovable). Once it is set, Lovable can send branded auth emails from your domain.
   - Action: complete the email-domain setup flow.

2. Scaffold custom auth email templates
   - Run the auth-template scaffold. This creates:
     - `supabase/functions/auth-email-hook/index.ts`
     - `supabase/functions/_shared/email-templates/recovery.tsx` (and the other five auth templates)
   - This is the first point at which the project owns the reset-password email markup.

3. Style only the recovery template for dark-mode readability
   - Read the app’s CSS tokens (`src/index.css`) and apply them to the scaffolded templates.
   - For the recovery email CTA button, use a colored background (e.g., the app’s primary blue) and force the button label to white (`#ffffff`) via inline styles so it remains visible whether the email client is in light or dark mode.
   - Keep the `Body` background white per email best-practice; only the button label/background are changed.

4. Deploy the auth email hook
   - Deploy `auth-email-hook` so the custom recovery template is used for future password-reset emails.

5. Verify
   - Trigger a reset-password email from `/auth` and confirm the button text is white on the colored background in both light and dark email clients.

Out of scope (per your answer)
- The other auth templates (signup, magic link, invite, email change, reauthentication) will be left as scaffolded defaults unless you ask to style them later.

Note
- Until a sender domain is configured, the reset email will continue to use Lovable’s default template and we cannot change its dark-mode styling.