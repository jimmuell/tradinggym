# Session Changelog — 2026-05-08

## 2026-05-08 — PL-028: TradingView Branding Removal (Simulator UI)

Removed all explicit TradingView branding, contract-month references, and TV-specific UI patterns from the Simulator UI. Legitimate partner references in `Resources.tsx`, `PineExportModal.tsx`, and `Landing.tsx` were intentionally left untouched.

### Files Modified
- `src/components/chart/TradeOrderPanel.tsx`
  - Replaced TV badge (`bg-[#2962ff]` + "TV") with TradingGYM badge (`bg-primary` + "TG").
  - Stripped contract month from label: `${instrument}M2026` → `instrument` (e.g. "MESM2026" → "MES").
- `src/components/chart/BottomBar.tsx`
  - Deleted the `TVIcon` component.
  - Removed `<TVIcon />` from the Paper Trading tab button (text-only label now).
- `src/components/chart/TopBar.tsx`
  - Removed the "Publish" button (TradingView concept).
  - Removed the trailing divider before the deleted Publish button.
- `src/components/chart/ChartContainer.tsx`
  - Removed the "TV" watermark in the bottom-left of the chart overlay.
  - Time-axis month labels left as-is (Lightweight Charts default formatting, not branding).
- `src/pages/Settings.tsx`
  - TradingGYM Live description: "use alongside TradingView" → "use alongside your trading platform".

### Notes
- `#2962ff` retained where it serves as standard buy-side trading UI convention (Trade panel buttons, toggles).
- No backend, schema, or edge-function changes.

---

## CM-1 — Admin Content Manager (List Page)

**New file:** `src/pages/admin/AdminContentPage.tsx` — admin-gated list view with Lessons/Quizzes tabs, module filter (All / Foundation F1–F5 / Tier 1–3), shadcn Table + Badge + Skeleton, friendly module labels, Edit links to `/admin/content/lesson/{id}` and `/admin/content/quiz/{id}` (CM-2 stubs), and disabled "+ New" buttons with "Coming in CM-2" tooltip.

**Modified:**
- `src/App.tsx` — registered `/admin/content` route under `LayoutRoute`.
- `src/components/dashboard/AppSidebar.tsx` — added "Content" item to `adminItems`.

Quizzes table has no `updated_at`, so the Updated column uses `created_at`. Admin gate via `useUserRole`. No DB or RLS changes.

---

## CM-2 — Admin Lesson + Quiz Editor

**New files:**
- `src/pages/admin/AdminLessonFormPage.tsx` — full platform-lesson editor (module + order + tier auto-derived, slides CRUD/reorder, PDF/image import via `SlideImportDialog`, preview via `LessonRenderer`, Save Draft / Publish / Delete). Writes `content_type='platform'`, `author_id=null`, `class_id=null`. Suggests `module_order` as next available slot per module on new lessons.
- `src/pages/admin/AdminQuizFormPage.tsx` — standalone platform-quiz editor (title, module, pass threshold, A/B/C/D questions with explanation, in-dialog preview highlighting correct answer, Save Draft / Publish / Delete). Writes `content_type='platform'`, `author_id=null`, `lesson_id=null`.

**Modified:**
- `src/App.tsx` — registered `/admin/content/lesson/new`, `/admin/content/lesson/:lessonId`, `/admin/content/quiz/new`, `/admin/content/quiz/:quizId` (literal `new` routes ordered before `:id` params).
- `src/pages/admin/AdminContentPage.tsx` — replaced disabled "Coming in CM-2" New buttons with active links to the new form routes; dropped unused Tooltip imports.

Mutations invalidate `['admin-content-lessons']` / `['admin-content-quizzes']` so the list view refreshes immediately. Admin gating via `useUserRole` on every form route.

---

## CM-2-FIX — Module Value Mismatch + Admin RLS Policies

**Problem:** CM-2 shipped with hardcoded module values (`f1`, `f2`, etc.) that didn't match the actual database values (`f1_candles`, `f2_structure`, etc.). Additionally, the `lessons` and `quizzes` tables had no `UPDATE` or `DELETE` RLS policies for admin users, causing save/delete to fail silently.

**Database (RLS migration):**
- Added `admin_update_platform_lessons` and `admin_delete_platform_lessons` policies on `lessons`.
- Added `admin_update_platform_quizzes` and `admin_delete_platform_quizzes` policies on `quizzes`.
- All four use `plan_state = 'admin'` via `EXISTS` subquery. No existing policies were modified.

**Modified:**
- `src/pages/admin/AdminContentPage.tsx`
  - `MODULE_LABELS` keys updated: `f1` → `f1_candles`, `f2` → `f2_structure`, etc.
  - `getShortLabel` now splits on `_` for foundation modules (`f1_candles` → `F1`).
  - `filteredLessons`: foundation filter uses `startsWith('f') && includes('_')` instead of exact `['f1'...'f5']`.
  - `filteredQuizzes`: foundation filter includes both `foundation` and `f*_` patterns.
- `src/pages/admin/AdminLessonFormPage.tsx`
  - `MODULE_OPTIONS` values updated to `f1_candles`, `f2_structure`, `f3_sessions`, `f4_risk`, `f5_plan`.
  - Fixes module dropdown blank on edit (existing `f1_candles` now matches an option) and `module_order` auto-suggestion.
- `src/pages/admin/AdminQuizFormPage.tsx`
  - `MODULE_OPTIONS` values updated similarly, with `foundation` retained for the Foundation Assessment quiz.

**Constraints preserved:**
- No existing RLS policies were modified — only new policies added.
- No student-facing pages or hooks changed.
- No guru lesson authoring pages touched.
- No data migration needed — DB values were already correct, code was wrong.

## CM-2-FIX-3 — Save Draft Failure (Type Poisoning)
- Replaced `slides as unknown as never` / `questions as unknown as never` with `JSON.parse(JSON.stringify(...))` to prevent TS `never` poisoning the Supabase update payload.
- Update calls now only send mutable fields (omit `content_type`/`author_id`/`class_id`/`lesson_id`).
- Added `console.error` and PostgrestError-aware message extraction in save/delete catch blocks.
- Files: `src/pages/admin/AdminLessonFormPage.tsx`, `src/pages/admin/AdminQuizFormPage.tsx`.
