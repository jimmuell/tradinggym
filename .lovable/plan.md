## Goal
Make the floating tier switcher visible on preview and published URLs (not just local dev), for all users.

## Change
**`src/components/dev/DevTierSwitcher.tsx`** — remove the `import.meta.env.DEV` gate in the default export so the panel always renders:

```ts
export default function DevTierSwitcher() {
  return <DevTierSwitcherInner />;
}
```

That's the only edit. The switcher is already mounted in `DashboardLayout`, so removing the gate makes it appear on all environments for every signed-in user in the dashboard.

## Notes / caveats
- `setTierState` only updates local React state — it does NOT change the user's real `tier_state` in the database. A page refresh reverts to the server value.
- Backend RLS is unaffected: this is a UI-only preview of gated screens. No data privilege escalation.
- The "DEV" label / tooltip text inside the panel currently says "Development only". I'll leave the visual as-is unless you want it relabeled (say the word and I'll rename it to something like "PREVIEW TIER").

## Verification
Type-check with `bunx tsc --noEmit`, then confirm the floating panel appears at the bottom of `/dashboard` on both the preview and published URLs.
