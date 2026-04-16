

# Fix Two Security Vulnerabilities

## Summary

Two database changes (migration) plus two code updates to use the new `update_own_profile` RPC instead of direct `.update()` calls.

## Step 1 — Database Migration

Run a single migration with:
1. Drop the existing UPDATE policy on `profiles`
2. Create `update_own_profile` security-definer function (only allows updating `display_name` and `avatar_url`)
3. Grant execute to `authenticated` role
4. Drop `Users can read system strategies` policy
5. Create `Users can read system strategies by tier` — tier-aware SELECT policy

## Step 2 — Update Profile.tsx

Replace the `.from('profiles').update(...)` call (line 34-37) with:
```ts
supabase.rpc('update_own_profile', { p_display_name: displayName })
```

## Step 3 — Update TierContext.tsx

The `setTierState` function (line 78-81) currently does `.from('profiles').update({ tier_state: tier })`. After removing the UPDATE policy, this will fail by design — tier changes must go through a privileged path.

Since `DevTierSwitcher` is the only consumer and is a dev-only tool, the `.update()` call will be removed. `setTierState` will only update local React state (keeping the dev switcher functional for UI testing without persisting).

## Step 4 — Run Security Scan

Re-run the scan and mark both findings as fixed.

## Files Changed

| File | Change |
|------|--------|
| Migration SQL | New migration with both fixes |
| `src/pages/Profile.tsx` | Use `supabase.rpc('update_own_profile', ...)` |
| `src/contexts/TierContext.tsx` | Remove `.from('profiles').update()` call |

