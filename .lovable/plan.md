## Goal

Replace the inline "New Chapter" form on the Admin Course Detail page with a dedicated **New Chapter page**, matching the existing pattern used for lessons, quizzes, and courses. Includes clean `display_order` shifting so inserts at any position never produce duplicate ordinals.

## Why

- Consistent with `AdminLessonFormPage`, `AdminQuizFormPage`, `AdminCourseFormPage` — chapters are the odd one out today.
- Eliminates the "form appears at the bottom, must scroll" problem permanently.
- Deep-linkable, refreshable, browser-back returns to the course detail naturally.
- Live placement preview prevents off-by-one ordering confusion before save.

## UX

**Trigger.** The existing **+ Add Chapter** button on `AdminCourseDetailPage` becomes a navigation link to the new route instead of toggling inline form state.

**New page layout** (mirrors `AdminLessonFormPage`):
- Back link: `← {Course title}` returning to `/admin/content/course/:courseId`
- Header: "New Chapter" + course name as subtitle
- Single-card form:
   - **Title** (required)
   - **Description** (optional)
   - **Position** — numeric input, defaulted to `nextChapterOrder` (max + 1), with helper text "This chapter will appear at position N of M+1"
- **Live placement preview**: compact, read-only list of existing chapters with the new one highlighted in its chosen slot, so the admin sees exactly where it lands before saving
- Footer actions: **Cancel** (returns to course detail) and **Create Chapter** (primary)

**On success.** Toast "Chapter added", invalidate `['admin-content-course', courseId]`, then `navigate(\`/admin/content/course/\${courseId}\`)`.

## Technical Plan

### 1. New route
File: `src/App.tsx`
- Import `AdminChapterFormPage`.
- Add route **before** `/:courseId` to avoid path collision:
   - `/admin/content/course/:courseId/chapter/new` → `<AdminChapterFormPage />` (wrapped in `LayoutRoute` like sibling admin routes)
- File/route is named generically so a future `/chapter/:chapterId` edit route can reuse the same component (parallels `AdminLessonFormPage`).

### 2. New page
File: `src/pages/admin/AdminChapterFormPage.tsx` (new)
- Admin guard via `useUserRole` (redirect non-admins to `/dashboard`), matching `AdminCourseDetailPage`.
- `useParams` to read `courseId`.
- `useQuery(['admin-content-course-min', courseId])` for course title + existing chapters (`id`, `title`, `display_order`).
- Local form state: `title`, `description`, `order`, `busy`.
- Submit handler does a **two-step write** to keep ordering clean:
   1. **Shift down** any chapters at or after the chosen position:
      ```
      supabase.from('chapters')
        .update({ display_order: order + ... })  // see note
        .eq('course_id', courseId)
        .gte('display_order', order)
      ```
      Implementation note: PostgREST cannot do `display_order = display_order + 1` in a single update from the JS client. Two safe options — pick **(a)** for simplicity:
      - **(a) Client-side fan-out:** read affected rows, then issue parallel `update({ display_order: row.display_order + 1 }).eq('id', row.id)` calls. Acceptable because chapter counts per course are small (typically < 20).
      - **(b) RPC:** add a `shift_chapter_orders(course_id, from_order)` SECURITY DEFINER function. Cleaner, atomic — defer unless option (a) shows issues in practice.
   2. **Insert** the new chapter:
      ```
      supabase.from('chapters').insert({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || null,
        display_order: order,
      })
      ```
   - If the chosen position equals `nextChapterOrder` (append at end), skip step 1 entirely.
- On success: invalidate course detail query, toast, navigate back.
- On failure of step 1: surface error and abort step 2 so we never leave partial gaps.

### 3. Wire the trigger
File: `src/pages/admin/AdminCourseDetailPage.tsx`
- Remove `addingChapter` state, the `NewChapterForm` component, and its inline render block.
- Change **+ Add Chapter** button to: `navigate(\`/admin/content/course/\${courseId}/chapter/new\`)`.
- Existing inline edit/reorder/delete on chapter cards stays untouched.

## Backend / Data

**No schema changes.** Same `chapters` table, same RLS policies (admin + guru insert paths already in place), same insert payload. No migration required for option (a).

## Out of Scope

- Editing an existing chapter via this page (existing inline edit stays as-is; route is named to allow easy `/:chapterId` extension later).
- Reordering existing chapters from the new page (use the up/down controls on the detail page).
- Reusing this page for Guru chapter authoring (CC-4 will get its own equivalent following the same pattern).