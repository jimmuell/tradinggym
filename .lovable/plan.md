# Plan

## 1. Landing page — remove periods from pricing headline
**File:** `src/pages/Landing.tsx` (line 384–386)
- "Start free. Upgrade when ready." → "Start free Upgrade when ready"
- "No credit card required. Practice with real data from day one." → "No credit card required Practice with real data from day one"

## 2. Settings & Profile — two-column layout
**File:** `src/pages/Settings.tsx` (line 23)
- Change wrapper from `grid gap-6 max-w-2xl` → `grid gap-6 md:grid-cols-2 max-w-5xl`
- The 6 cards (Billing, Live, Appearance, Notifications, Security, Danger Zone) flow into a two-column grid on md+, single column on mobile.

**File:** `src/pages/Profile.tsx` (line 118)
- Change wrapper from `grid gap-6 max-w-2xl` → `grid gap-6 md:grid-cols-2 max-w-5xl`
- Account Information card and Account Details card sit side-by-side.

## 3. Pricing page — 4 cards horizontally
**File:** `src/pages/PricingPage.tsx`
- Merge the standalone Guru card into the main `PLANS` grid so all four (Free, Pro, Expert, Guru) render in one 4-column row.
- Add `guru` entry to `PLANS` array with name "Guru", price "$99", `/mo`, and the existing Guru feature list (lines 253–261).
- Change both grids (loading skeleton line 125, real grid line 131) from `md:grid-cols-3` → `md:grid-cols-2 lg:grid-cols-4`; render 4 skeletons.
- Reduce card padding from `p-8` → `p-6` and feature `space-y-3` → `space-y-2` so cards stay compact.
- Inside the map, branch styling/CTA when `p.key === 'guru'`: amber border/badge ("For Educators"), amber subscribe button using `GURU_PRICE_ID`, "Current Plan" state when active.
- Delete the standalone Guru section (lines 214–292).
- Keep the bottom "Manage Subscription" / footer note block as-is.

## Notes
- No DB or routing changes.
- No changes to other components or layout shells.
