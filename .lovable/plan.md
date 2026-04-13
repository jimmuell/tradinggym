

## Route Restructuring & Auth Pages

### Overview
Move the current chart/simulator from `/` to `/simulator`, add Login/Signup UI at `/`, and create titled placeholder pages for all PRD modules.

### Route Map

| Route | Page | Content |
|-------|------|---------|
| `/` | Auth | Login/Signup tabs (UI only, no backend) |
| `/simulator` | Simulator | Current chart page (existing Index.tsx content) |
| `/dashboard` | Dashboard | Title placeholder |
| `/strategies` | Strategies | Title placeholder |
| `/backtesting` | Backtesting | Title placeholder |
| `/resources` | Resources | Title placeholder |
| `/coaching` | Coaching | Title placeholder |
| `/analytics` | Analytics | Title placeholder |

### Files to Create

1. **`src/pages/Simulator.tsx`** — Move current `Index.tsx` content here (chart, trade panel, toolbars)
2. **`src/pages/Auth.tsx`** — Login/Signup page with shadcn Tabs, Card, Input, Button. Dark themed (`#131722`). Two tabs: "Log In" (email + password + button) and "Sign Up" (email + password + confirm password + button). UI only.
3. **`src/pages/Dashboard.tsx`** — Dark page with "Dashboard" title
4. **`src/pages/Strategies.tsx`** — Dark page with "Strategies" title
5. **`src/pages/Backtesting.tsx`** — Dark page with "Backtesting" title
6. **`src/pages/Resources.tsx`** — Dark page with "Resources" title
7. **`src/pages/Coaching.tsx`** — Dark page with "Coaching" title
8. **`src/pages/Analytics.tsx`** — Dark page with "Analytics" title

### Files to Modify

- **`src/App.tsx`** — Update routes: `/` → Auth, `/simulator` → Simulator, add all new routes
- **`src/pages/Index.tsx`** — Replace with re-export or redirect to keep backward compat (or simply remove)

### Technical Notes
- Placeholder pages use a simple centered `h1` on `bg-[#131722]` with white text
- Auth page uses shadcn `Tabs`, `Card`, `Input`, `Button`, `Label` — no real auth logic
- No sidebar added yet — that comes as a separate step

