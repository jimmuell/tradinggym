
## Problem

Root cause found in `src/lib/adminSettings.ts` → `isDevHost()`:

```ts
h.endsWith('.lovable.app')
```

This makes **every** `*.lovable.app` host count as Preview — including the published site `keen-chart-clone.lovable.app`. So flipping "Enabled in preview" on also shows the dev buttons on the published URL, and the "Enabled in production" toggle currently controls nothing except a hypothetical custom domain.

## Fix

Rewrite host classification so only true preview/dev hosts are Preview, and everything else (including bare `*.lovable.app`) is Production.

**Preview hosts** (Preview toggle controls these):
- `localhost` / `127.0.0.1`
- `*.lovableproject.com` (sandbox)
- `id-preview--*.lovable.app` and `preview--*.lovable.app` (Lovable preview subdomains)

**Production hosts** (Production toggle controls these):
- Bare `<slug>.lovable.app` (published Lovable URL, e.g. `keen-chart-clone.lovable.app`)
- Any custom domain

### Change 1 — `src/lib/adminSettings.ts`

Replace `isDevHost()` with stricter matching:

```ts
export const isDevHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.lovableproject.com')) return true;
  // Only Lovable *preview* subdomains count as dev, not the published *.lovable.app
  if (h.endsWith('.lovable.app') && (h.startsWith('preview--') || h.startsWith('id-preview--'))) {
    return true;
  }
  return false;
};
```

`shouldShowDevSignIn()` stays the same and now correctly routes the published URL through the Production toggle (default `false`).

### Change 2 — `src/pages/admin/AdminSettingsPage.tsx` (labels only, no logic change)

Clarify what each toggle controls so it's obvious which URL is affected:

- "Enabled in preview" → **"Enabled on preview / localhost"**, subtext: `localhost, *.lovableproject.com, id-preview--*.lovable.app`
- "Enabled in production" → **"Enabled on published site"**, subtext: `Your published *.lovable.app URL and any custom domain`
- Keep the existing warning that toggles are per-browser (localStorage) and will be removed before launch.

## Verification

1. On `keen-chart-clone.lovable.app` (published) with Preview=ON, Production=OFF → dev buttons hidden ✅
2. On `id-preview--*.lovable.app` (preview) with Preview=ON → dev buttons visible ✅
3. On `localhost:8080` with Preview=ON → dev buttons visible ✅
4. Admin Settings page shows `Current environment: production` when viewed on the published URL (previously showed `preview`).

Scope: 2 files, presentation/logic-only in `src/lib` + label copy in the admin settings page. No backend or auth changes.
