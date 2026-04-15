

# Build a Professional Landing Page for TradeGYM

## Summary
Create a new public landing page at `/` that showcases TradeGYM's value proposition and drives signups. Move the current Auth page to `/auth`. The landing page will be a single-page marketing experience with multiple sections, smooth scroll, and a dark trading-themed aesthetic.

## Routing Change
- **New file:** `src/pages/Landing.tsx` — the public landing page at `/`
- **Move Auth:** `Route path="/"` becomes Landing, add `Route path="/auth"` for login/signup
- All "Get Started" / "Sign Up" CTAs link to `/auth`

## Landing Page Sections

### 1. Hero Section
- Large headline: **"The learning layer TradingView was never meant to be"**
- Subheadline: *"Turn any MES futures strategy into a structured, testable blueprint. Practice until execution becomes instinct."*
- Two CTAs: "Get Started Free" (primary) and "See How It Works" (scroll to features)
- Dark gradient background with subtle chart-line animation or static graphic

### 2. Problem Statement
- Three pain-point cards:
  - "No System" — Most traders lose because they trade on impulse
  - "Information Overload" — Gurus, indicators, conflicting advice
  - "No Validation" — Strategies never tested against real data
- Tagline: *"TradeGYM creates the system, enforces it, and proves it with data."*

### 3. How It Works (4-Step Visual)
- Step 1: **Learn** — Foundation modules teach candles, structure, risk
- Step 2: **Practice** — Simulator with bar-by-bar replay and blueprint overlay
- Step 3: **Validate** — Backtest against 18 years of real MES data
- Step 4: **Execute** — Automate validated strategies (Expert tier)
- Each step with an icon and brief description

### 4. Feature Highlights (Card Grid)
- **Trading Simulator** — TradingView-powered chart with MES replay
- **Strategy Blueprints** — Step-by-step execution checklists
- **AI Strategy Ingestion** — Upload YouTube/article, get a testable strategy
- **Backtesting Engine** — Walk-forward validation, Monte Carlo, win-rate gate
- **Coaching Module** — Connect with coaches, track student progress
- **Automated Execution** — Expert tier broker connection with risk controls

### 5. Tier Progress Visual
- Visual stepper: Foundation → Tier 1 (ORB) → Tier 2 (VWAP) → Tier 3 (AMD)
- Brief description of each tier's focus and graduation gate

### 6. Pricing Section
- 4-tier pricing cards: Free ($0), Pro ($29/mo), Coach ($49/mo), Expert ($99/mo)
- Feature comparison pulled from PRD Section 8
- "Get Started Free" CTA on each card

### 7. Footer
- TradeGYM branding, MES-only scope note, links to Auth

## Design Approach
- Dark theme consistent with trading platforms (bg-[#0b0e13] to [#131722] gradients)
- Blue accent (#3B82F6) for CTAs and highlights
- Green/red accents for trading terminology
- Responsive: stacked on mobile, grid on desktop
- Semantic Tailwind tokens where applicable, hardcoded dark values for landing-only sections
- No external dependencies — pure Tailwind + existing shadcn/ui components (Card, Badge, Button)

## Files Changed
| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | **New** — Full landing page component |
| `src/App.tsx` | Update routes: `/` → Landing, `/auth` → Auth |
| `src/pages/Auth.tsx` | Fix theme (use semantic tokens), update any back-links |
| `src/components/ProtectedRoute.tsx` | Ensure redirect goes to `/auth` not `/` |
| `src/contexts/AuthContext.tsx` | Check redirect logic |

## Technical Notes
- The landing page is fully public (no ProtectedRoute wrapper)
- Auth page redirect-on-session still navigates to `/dashboard`
- All navigation from landing goes to `/auth` for signup/login
- Save the PRD to `mem://` for future reference

