# P15b — Fix Profile Save Button Dirty State Bug

---

## THE BUG

The Save button on the Profile page is always enabled, even when the display name has not been changed. This happens because `displayName` state is initialized to `''` and then set via `useEffect` after the query resolves, causing `hasChanged` to briefly evaluate to `true` and stay there.

Current broken pattern:
```tsx
const [displayName, setDisplayName] = useState('')

useEffect(() => {
  if (profile?.display_name) {
    setDisplayName(profile.display_name)
  }
}, [profile])

const hasChanged = displayName !== (profile?.display_name ?? '')
```

---

## THE FIX

In `src/pages/Profile.tsx`, replace the `useState` + `useEffect` pattern with a single controlled value derived from query data.

Replace the existing `displayName` state, `useEffect`, and `hasChanged` with this pattern:

```tsx
const [displayName, setDisplayName] = useState<string | null>(null)

// Initialize once when profile data first loads
useEffect(() => {
  if (profile?.display_name !== undefined && displayName === null) {
    setDisplayName(profile.display_name ?? '')
  }
}, [profile, displayName])

const currentValue = displayName ?? ''
const hasChanged = currentValue !== (profile?.display_name ?? '')
```

And update the input and button to use `currentValue`:

```tsx
<Input
  id="displayName"
  placeholder="Enter your display name"
  value={currentValue}
  onChange={(e) => setDisplayName(e.target.value)}
  ...
/>

<Button
  onClick={() => mutation.mutate(currentValue)}
  disabled={mutation.isPending || isLoading || !hasChanged}
  ...
>
  {mutation.isPending ? 'Saving…' : 'Save Changes'}
</Button>
```

---

## PART 1 — Database Changes

None.

---

## PART 2 — Profile Page Fix

Apply the pattern above to `src/pages/Profile.tsx` only.

---

## PART 3 — No New Pages

No new pages or routes required.

---

## PART 4 — Routing

No routing changes required.

---

## CONSTRAINTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fix Profile.tsx only — do NOT change any other file
- Do NOT change the visual design, layout, or any other page
- Do NOT change the sidebar, header, or routing
- The Save button must be disabled on load when value matches DB
- The Save button must enable only when the user has actually changed the value
- Use React Query for all Supabase reads and writes
- Use AuthContext for user id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
