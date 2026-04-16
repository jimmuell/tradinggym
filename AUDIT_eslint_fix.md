# AUDIT — Fix ESLint Errors in App Code

This is a code quality audit. Fix all issues listed below without changing any behaviour, UI, or business logic.

---

## PART 1 — Database Changes

None.

---

## PART 2 — Fixes Required

### 1. `src/lib/drawingTypes.ts` — Replace `any` with proper types

Lines 13, 15, 23, 25, 34 use `any`. Replace with typed alternatives:
- For canvas/SVG event handlers: use `MouseEvent` or `React.MouseEvent`
- For drawing point coordinates: use `{ x: number; y: number }`
- For drawing shape data: use a union of the existing drawing type interfaces defined in the same file
- If a type truly cannot be narrowed, use `unknown` and add a type guard

### 2. `src/components/chart/DrawingOverlay.tsx` — Replace `any` with proper types

Lines 73, 77, 464, 470, 483, 496 use `any`. Apply the same typed alternatives as above using the types from `drawingTypes.ts`.

### 3. `src/components/chart/TradeOrderPanel.tsx` — Fix unused expression

Line 279: `Expected an assignment or function call and instead saw an expression`. Find the expression and either assign it to a variable, call it as a function, or remove it if it has no effect.

### 4. `src/pages/Simulator.tsx` — Replace `any` (line 126)

Replace `any` with the correct type for the value at that line. Check what the variable holds and use the narrowest correct type.

### 5. `src/pages/Strategies.tsx` — Replace `any` (lines 145, 159)

Replace `any` with the correct Supabase row type or a local interface matching the strategies table schema.

### 6. `src/pages/StrategyDetailPage.tsx` — Replace `any` (lines 63, 96, 112, 117, 120, 130, 154)

Replace `any` with the correct Supabase row type or a local interface. Use the existing strategy type if one is already defined.

### 7. `src/components/ui/command.tsx` — Fix empty interface (line 24)

`An interface declaring no members is equivalent to its supertype`. Either add at least one member, extend directly without the interface, or replace with a type alias.

### 8. `src/components/ui/textarea.tsx` — Fix empty interface (line 5)

Same fix as above.

---

## PART 3 — Do NOT fix (intentionally skipped)

- `react-refresh/only-export-components` warnings in `ui/` files — these are generated shadcn components, leave them alone
- `react-hooks/exhaustive-deps` warnings in `ChartContainer.tsx` — complex chart logic, leave for a dedicated simulator refactor
- `react-hooks/exhaustive-deps` warning in `TierContext.tsx` line 78 — intentional dependency omission
- `react-hooks/exhaustive-deps` warning in `DrawingOverlay.tsx` line 526 — intentional
- `react-refresh/only-export-components` in context files — leave alone

---

## PART 4 — Routing

No routing changes required.

---

## CONSTRAINTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fix ONLY the files and lines listed above
- DO NOT change any UI, layout, behaviour, or business logic
- DO NOT change the sidebar, header, routing, or any other page
- DO NOT change the visual design system
- After fixing, the app must still build and run without errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
