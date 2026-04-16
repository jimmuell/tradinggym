

# P14 — Strategies Page with Real CRUD

## Confirmed: `isUnlocked()` exists
`TierContext` already exposes `isUnlocked(tier: TierState) => boolean` which compares tier indices. Will use it directly — no changes to TierContext needed.

## Step 1 — Database Migration
Create `strategies` table with all specified columns, RLS policies (5 policies for system read, own CRUD), then seed 3 system strategies.

## Step 2 — Rewrite `src/pages/Strategies.tsx`
- Fetch system + user strategies via React Query
- Two sections: "TradeGYM Strategies" and "My Strategies"
- 3-col grid, tier lock via `const { isUnlocked } = useTier()` → `!isUnlocked(strategy.tier_required as TierState)`
- Locked cards: dimmed, tier badge, toast on click
- Unlocked cards: navigate to `/strategies/:id`
- "New Strategy" button → `/strategies/new`, disabled when foundation user has 1+ strategies
- Empty state + skeletons

## Step 3 — Create `src/pages/StrategyDetailPage.tsx`
- Mode: `const { id } = useParams(); const isNew = id === 'new';`
- System strategies: read-only, banner
- User strategies: editable, save/delete with confirmation
- Create mode: field gating for foundation users (name/description/notes only, others locked)
- React Query mutations, toasts, navigation

## Step 4 — Update `src/App.tsx`
Add route `/strategies/:id` → `StrategyDetailPage` wrapped in `LayoutRoute`.

## Files Created/Modified
| File | Action |
|------|--------|
| Migration SQL | Create table + seed |
| `src/pages/Strategies.tsx` | Rewrite |
| `src/pages/StrategyDetailPage.tsx` | Create |
| `src/App.tsx` | Add route |

