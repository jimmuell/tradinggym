

## Batch 1: Fix Placeholder Themes + Build Dashboard UI

### Part A — Fix 5 placeholder pages (quick)
Replace hardcoded `bg-[#131722]` and `text-white` with `bg-background` and `text-foreground` in:
- `Strategies.tsx`
- `Backtesting.tsx`
- `Analytics.tsx`
- `Coaching.tsx`
- `Resources.tsx`

### Part B — Build Dashboard page
Replace the placeholder with a full dashboard layout using static/placeholder data. All values are hardcoded for now — no database queries.

**Layout structure:**
```text
┌─────────────────────────────────────────────────┐
│  Practice Account Header                        │
│  Balance: $10,000.00          [Reset Account]   │
├────────┬────────┬────────┬────────┬─────────────┤
│ Total  │ Win    │ Avg    │ Max    │ Sessions    │
│ Trades │ Rate   │ R:R    │ DD     │ Completed   │
│ 0      │ 0%     │ 0.0    │ $0     │ 0           │
├────────┴────────┴────────┴────────┴─────────────┤
│  Tier Progress                                  │
│  [Foundation] → [Tier 1] → [Tier 2] → [Tier 3] │
├─────────────────────┬───────────────────────────┤
│  Equity Curve       │  Recent Trades            │
│  (empty state)      │  (empty state)            │
└─────────────────────┴───────────────────────────┘
```

**Components used:** Card, Badge, Progress, Table — all from existing shadcn/ui library.

**Sections:**
1. **Practice Account card** — Shows balance ($10,000 default), a "Reset Account" button (non-functional for now)
2. **Stats grid** — 5 metric cards in a row: Total Trades, Win Rate, Avg R:R, Max Drawdown, Sessions Completed — all showing zero/empty state
3. **Tier Progress bar** — Visual stepper showing Foundation → Tier 1 → Tier 2 → Tier 3 with "Foundation" highlighted as current
4. **Equity Curve area** — Card with empty state message: "Complete your first trading session to see your equity curve"
5. **Recent Trades table** — Card with empty state message: "No trades yet. Head to the Simulator to start practicing"

### Part C — Sidebar tweak
Rename "Resources" to "Learning" and swap the `FolderOpen` icon to `BookOpenCheck` to match PRD terminology.

### Files changed
- `src/pages/Strategies.tsx` — theme fix (2 classes)
- `src/pages/Backtesting.tsx` — theme fix
- `src/pages/Analytics.tsx` — theme fix
- `src/pages/Coaching.tsx` — theme fix
- `src/pages/Resources.tsx` — theme fix
- `src/pages/Dashboard.tsx` — full rebuild with dashboard layout
- `src/components/dashboard/AppSidebar.tsx` — rename Resources → Learning, swap icon

