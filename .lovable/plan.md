

# P44 — Quiz Results, Per-Question Review, Module Cross-Reference

## Database

**Migration** — add `responses jsonb default '[]'::jsonb` column to `quiz_attempts`.

**Data update (insert tool)** — UPDATE the Foundation quiz row to add `source_lesson_id` (UUID) and `source_slide_index` (default 0) onto each question in the `questions` JSONB. Mapping uses live UUIDs from the lessons table:

- q1, q2 → `6fd2ef4e…` (F1 — Reading Candles)
- q3, q4 → `c3f382c6…` (F2 — Market Structure)
- q5, q6 → `025fdafd…` (F3 — Sessions & Time)
- q7, q8 → `b50d51f1…` (F4 — Risk Management)
- q9, q10 → `285130d8…` (F5 — Your Trading Plan)

`source_slide_index` defaults to `0` for all questions (slide-level mapping not specified per-question; deep-link still lands inside the right lesson).

## Hooks

**New `src/hooks/useQuizAttempts.ts`:**
- `useQuizAttempts(quizId)` — list current user's attempts for a quiz, ordered DESC by `completed_at`. Returns full rows including `responses`.
- `useSaveQuizAttempt()` — replaces the existing one in `useQuizzes.ts`. Inserts `responses` JSONB alongside legacy `answers` (keeps backward compatibility). Invalidates `['quiz-attempts', quizId]` and best-attempt cache.

**`useQuizzes.ts`:** extend `QuizQuestion` type with optional `source_lesson_id`, `source_lesson_title`, `source_slide_index`. Extend `QuizAttempt` with `responses`. Re-export old `useSaveQuizAttempt` from new hook file (or delete and switch importers).

## QuizRunner refactor (`src/components/learning/QuizRunner.tsx`)

Replace the existing finished-state block with a richer results view inside the same component. No new route.

**Behavior changes:**
- Remove the auto-call to `onComplete` from the save effect. `onComplete` now only fires when the user clicks an explicit action button.
- On finish, build a `responses[]` array (one entry per question with all denormalized fields per spec) and save via `useSaveQuizAttempt`.
- Lookup `source_lesson_title` from a new optional `lessonTitleById` prop (Map) passed by the parent — keeps the component DB-agnostic. Falls back to the title baked into the question if present.

**Results view layout:**
1. **Summary card**: score `X / Y (Z%)`, PASSED/NOT PASSED badge, tier-promotion success banner (only when parent passes `promotionMessage` prop).
2. **Action row**: `Review Answers` (smooth-scrolls to list), `Retake Quiz` (resets state, allows new attempt), and either `Continue to Tier 1 →` (pass) or `Back to Foundation` (fail) — both wired through callbacks.
3. **Per-question review** using shadcn `Accordion` (`type="multiple"`):
   - Correct items: green left-border, check icon, collapsed by default.
   - Wrong items: red left-border, X icon, expanded by default (`defaultValue` includes their ids).
   - Each item shows question text, all 4 options (user's answer highlighted; correct one marked green), explanation in muted callout.
   - For wrong answers, footer link: `📖 Review this in: <lesson title> → Slide <n+1>` linking to `/learning/foundation/{source_lesson_id}?slide={source_slide_index}` via `react-router-dom` `Link` (same tab).

## Foundation page (`src/pages/learning/Foundation.tsx`)

Add a **Quiz History** section above the Foundation Assessment card, visible only when `useQuizAttempts(quiz?.id)` returns ≥1 row.

- Table-like compact list: date (formatted), `score/total — %`, pass/fail badge, `Review` button.
- Default shows latest 5; `Show all` toggle expands to full history.
- `Review` opens a shadcn `Dialog` rendering a read-only version of the per-question review (reuses a new shared `<QuizResponsesReview responses={…} />` extracted from QuizRunner so the Dialog and live results share code).

## FoundationLesson page (`src/pages/learning/FoundationLesson.tsx`)

Update `QuizView`:
- Build `lessonTitleById` from `useFoundationLessons` and pass to `QuizRunner`.
- Move tier-promotion + navigation logic into callback props (`onContinue`, `onBackToFoundation`) instead of the auto-`handleComplete`. Promotion fires when `QuizRunner` reports a passing save (via new `onPassed` callback or by checking inside `onContinue`).

## LessonRenderer deep-link (`src/components/learning/LessonRenderer.tsx`)

- Read `slide` query param via `useSearchParams`.
- Initialize `index` state with `Math.min(Math.max(parseInt(slideParam ?? '0', 10) || 0, 0), total - 1)`. Use a one-time effect keyed on `lesson?.id` so navigation between slides via Next/Prev still works without the URL forcing reset.

## File touch list

- New: `supabase/migrations/<ts>_quiz_attempts_responses.sql`
- New: `src/hooks/useQuizAttempts.ts`
- New: `src/components/learning/QuizResponsesReview.tsx` (shared per-question review block)
- Edited: `src/hooks/useQuizzes.ts` (types + re-export)
- Edited: `src/components/learning/QuizRunner.tsx`
- Edited: `src/components/learning/LessonRenderer.tsx`
- Edited: `src/pages/learning/Foundation.tsx`
- Edited: `src/pages/learning/FoundationLesson.tsx`
- Data update via insert tool: tag Foundation quiz questions with `source_lesson_id`/`source_slide_index`.

## Constraints honored

React Query for all DB IO · TierContext for tier · AuthContext for user · no sidebar/header changes · no design-system changes · skeletons during loads · no new routes · responses JSONB denormalized · unlimited retakes · `promote_tier` RPC unchanged · LessonRenderer existing behavior preserved.

