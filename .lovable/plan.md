

# P14 Tests — Vitest + Playwright

## Vitest — `src/test/strategies.test.tsx`

**Approach:** Since `StrategyCard` is a local function inside `Strategies.tsx` (not exported), tier lock tests will render the full `Strategies` page with mocked dependencies. Field gating tests will render `StrategyDetailPage` with mocked `useParams`.

**Mocking strategy:**
- Mock `@/integrations/supabase/client` — return controlled data from `.from().select()`
- Mock `@/contexts/AuthContext` — provide fake user
- Mock `@/contexts/TierContext` — control `currentTier` and `isUnlocked`
- Mock `react-router-dom` partially — mock `useNavigate`, `useParams`
- Wrap in `QueryClientProvider`, `BrowserRouter`, `TooltipProvider`

**Test cases:**

1. **Tier lock: foundation user sees tier1 strategy locked** — render Strategies page with system strategies including a `tier_required: 'tier1'` strategy and `currentTier: 'foundation'`. Assert lock overlay with "Complete Tier 1 to unlock" text is visible.

2. **Tier lock: tier1 user sees tier1 strategy unlocked** — same data but `currentTier: 'tier1'`. Assert no lock overlay, "View Details" button visible.

3. **Tier lock: tier1 user sees tier2 strategy locked** — `tier_required: 'tier2'`, `currentTier: 'tier1'`. Assert lock overlay visible.

4. **Field gating: foundation create form** — render `StrategyDetailPage` with `useParams` returning `{ id: 'new' }`, `currentTier: 'foundation'`. Assert Name input exists and is not readonly, Description and Notes textareas exist. Assert "Upgrade to Pro to unlock" text appears 5 times (Instrument, Timeframe, Direction Bias, Entry Rules, Exit Rules).

5. **Field gating: tier1 create form** — same but `currentTier: 'tier1'`. Assert no "Upgrade to Pro to unlock" text. All fields rendered.

---

## Playwright — `e2e/strategies.spec.ts`

Uses the `test` and `expect` from `playwright-fixture.ts`. Requires auth — will sign in via the `/auth` page at suite start.

**Structure:** Single `test.describe` block with `test.describe.configure({ mode: 'serial' })`. Three sequential tests sharing state via a variable for the created strategy URL.

1. **Create strategy** — navigate to `/strategies`, click "New Strategy", fill name "E2E Test Strategy", click Save, wait for redirect, navigate back to `/strategies`, assert "E2E Test Strategy" visible in page.

2. **Edit strategy name** — click on "E2E Test Strategy" card, clear name input, type "E2E Renamed Strategy", click Save, wait for toast, reload page, assert input value is "E2E Renamed Strategy".

3. **Delete strategy** — on detail page, click trash button, confirm in alert dialog, assert redirect to `/strategies`, assert "E2E Renamed Strategy" not visible.

---

## Files

| File | Action |
|------|--------|
| `src/test/strategies.test.tsx` | Create — 5 Vitest unit tests |
| `e2e/strategies.spec.ts` | Create — 1 describe block, 3 serial Playwright tests |

