## Content Manager Documentation Spec

Produce a single self-contained markdown file that lets an AI agent rebuild the Content Manager as a standalone app, with no access to this repo.

### Deliverable

`docs/CONTENT_MANAGER_SPEC.md` — one file, ~800–1200 lines, no external links required to implement.

### Document structure

1. **Overview** — purpose (admin authoring tool for a 3-level learning hierarchy: Course → Chapter → Lesson, plus Course-level Quizzes), who uses it (admins; gurus get a parallel scope), what it produces (published lessons/quizzes consumed by a student app).

2. **Domain model** — plain-English entity descriptions and the relationships:
   ```text
   Course (1) ──< Chapter (N) ──< Lesson (N)
   Course (1) ──< Quiz   (N)        Lesson has ordered Slides[]
                                    Quiz has ordered Questions[]
   ```
   Content scoping: `platform` (admin-authored, global) vs `guru` (author-scoped, tied to a class). Tier gating: `foundation | tier1 | tier2 | tier3`.

3. **Database schema** — full DDL for every table the CM touches:
   - `courses`, `chapters`, `lessons`, `quizzes`, `quiz_attempts`, `profiles` (role + plan_state columns CM depends on).
   - Column list, types, defaults, nullability, intended use of each field.
   - JSONB shape definitions for `lessons.slides` and `quizzes.questions` (TypeScript interfaces + example JSON).
   - `display_order` / `module_order` semantics, the "shift down on insert" rule for chapters.
   - Indexes worth creating.

4. **Authorization model** — RLS policies in SQL + English summary:
   - Admin (plan_state='admin') full CRUD on platform content.
   - Guru (author_id = auth.uid(), content_type='guru') CRUD on their own.
   - Public read of published platform content; enrolled-student read of published guru content via `student_is_enrolled_in_class()`.
   - Required helper functions (`is_admin`, `student_is_enrolled_in_class`) with full SQL.

5. **Module taxonomy** — exact enum-like values (`f1_candles…f5_plan`, `tier1_*`, `foundation`) and how `module` is derived from `(course.tier_required, chapter index)` for backward compat.

6. **UI surface** — route map and what each screen does:
   - `/admin/content` — Courses + Quizzes tabs, filters, table columns
   - `/admin/content/course/new` and `/:courseId/edit`
   - `/admin/content/course/:courseId` — detail w/ chapters + lessons + course quiz
   - `/admin/content/course/:courseId/chapter/new` — dedicated page, live placement preview, shift-down-on-insert
   - `/admin/content/lesson/new?chapterId=&courseId=` and `/:lessonId`
   - `/admin/content/quiz/new?courseId=` and `/:quizId`
   - For each screen: required props/query params, key components (table, breadcrumb, slide editor, question editor, PDF/image import), save/publish/delete actions, navigation on success.

7. **Lesson slide editor** — slide types (`text`, `imported`), reorder, image upload to a public `lesson-assets` bucket, PDF→per-page image import flow, preview via renderer.

8. **Quiz editor** — A/B/C/D question shape with `correct_index` + `explanation`, pass threshold (default 80), preview with correct answer highlighted, attempt scoring formula.

9. **Tech assumptions for the standalone app** — React + Vite + TS + Tailwind + shadcn/ui + TanStack Query + React Router + Supabase (Auth + Postgres + Storage). Note that any equivalent stack works; the contract is the schema + RLS + route behaviors.

10. **Bootstrap checklist** — ordered steps an agent should execute: create Supabase project → run migrations (provided inline) → seed 4 platform courses + chapters → wire auth + admin role → scaffold routes → implement screens in the order list→detail→forms.

11. **Out of scope** — student-facing learning UI, payments, guru onboarding, analytics. Lists what the doc intentionally does not cover.

### Sources used to build the doc

- `change_log/CHANGELOG_2026-05-08.md` (CM-1, CM-2, CC-1, CC-2 entries)
- Live DB schema + RLS from this project (courses, chapters, lessons, quizzes, quiz_attempts, profiles)
- `src/pages/admin/AdminContentPage.tsx`, `AdminCourseDetailPage.tsx`, `AdminCourseFormPage.tsx`, `AdminChapterFormPage.tsx`, `AdminLessonFormPage.tsx`, `AdminQuizFormPage.tsx`
- `src/hooks/useLessons.ts`, `useQuizzes.ts` for type shapes
- `src/components/learning/LessonRenderer.tsx`, `QuizRunner.tsx`, `guru/SlideImportDialog.tsx`

### Non-goals for this task

- No code changes.
- No new docs other than this one file.
- No rewrite of student/guru pages.

Approve and I'll write the file.
