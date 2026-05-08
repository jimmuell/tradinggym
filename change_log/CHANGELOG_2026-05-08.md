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
