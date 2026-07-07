## Context

Confirmed: this is TradingGYM Web. The bug is real and reproducible in the codebase:

- `src/pages/learning/FoundationLesson.tsx`, `src/components/learning/TierLessonList.tsx`, and `src/components/dashboard/LearningProgressCard.tsx` all read/write a single global `localStorage["completedLessons"]` array — not scoped per user.
- `src/hooks/usePromoteTier.ts` (called from `FoundationLesson.tsx` after the quiz) drives graduation from the client. Even though a server RPC `promote_tier` exists, `profiles` currently allows self-updates of `tier_state` (see `update_own_profile` and the profile RLS), so the client can also just PATCH `tier_state` directly.
- `starter@gmail.com` (`ee1dbf66-…`) sits at `tier_state='tier1'` with zero `quiz_attempts` — matches the leak.

## Plan

### 1. Server-side per-user lesson progress

Migration:
- `create table public.lesson_progress (user_id uuid references auth.users on delete cascade, lesson_id uuid references public.lessons(id) on delete cascade, completed_at timestamptz not null default now(), primary key (user_id, lesson_id))`
- `GRANT SELECT, INSERT, DELETE ON public.lesson_progress TO authenticated; GRANT ALL ON public.lesson_progress TO service_role;`
- Enable RLS. Policies:
  - `select` where `user_id = auth.uid()`
  - `insert` with check `user_id = auth.uid()`
  - (no update; delete self only — needed for "reset progress")

### 2. `graduate_foundation()` (SECURITY DEFINER)

- Verifies for `auth.uid()`:
  - a `quiz_attempts` row exists with `passed=true` for the quiz whose `module='foundation'`
  - every published Foundation lesson (`lessons where tier_required='foundation' and content_type='platform' and is_published=true`) has a matching `lesson_progress` row
- On success: `update profiles set tier_state='tier1' where user_id=auth.uid() and tier_state='foundation'`; returns `jsonb {success:true}`.
- On failure: returns `{success:false, error, missing_lessons?, quiz_passed?}` — no exception, so UI can show reason.
- `GRANT EXECUTE ... TO authenticated`.

### 3. Lock down `profiles.tier_state`

- Drop/replace the profiles `UPDATE` policy so `tier_state` (and `plan_state`, `role`) cannot be changed by the user directly. Simplest: keep the existing `update_own_profile` RPC as the only client path for `display_name` / `avatar_url` / `risk_acknowledged_at`, and change the UPDATE policy on `profiles` to allow the user to update their row only when `tier_state`, `plan_state`, and `role` are unchanged (`OLD.tier_state IS NOT DISTINCT FROM NEW.tier_state AND ...`).
- Also harden existing `promote_tier()` — keep it, but Foundation → Tier1 path will only be reachable via `graduate_foundation()` from the UI. Leave tier2/tier3 promotion logic as-is (already server-verified against trades/win rate).

### 4. Frontend changes (all UI-only, no business-logic drift)

- New hook `src/hooks/useLessonProgress.ts`:
  - `useCompletedLessonIds()` — React Query, `select lesson_id from lesson_progress where user_id = auth.uid()`.
  - `useMarkLessonComplete()` — inserts `{user_id, lesson_id}` (upsert on conflict do nothing), invalidates the query.
- Replace the three localStorage read/write sites:
  - `FoundationLesson.tsx` — `markComplete` → `useMarkLessonComplete().mutate(lesson.id)`.
  - `TierLessonList.tsx` — read from `useCompletedLessonIds()` instead of localStorage.
  - `LearningProgressCard.tsx` — same.
- `FoundationLesson.tsx` `doPromote()` currently calls `promote.mutate('tier1', ...)` (which hits `promote_tier`). Change the Foundation → Tier1 path to call new `useGraduateFoundation()` hook that invokes `graduate_foundation()` RPC. Show returned error message via toast if unmet.
- `AuthContext`: on `SIGNED_IN` / `SIGNED_OUT`, purge any legacy `completedLessons` key and invalidate the lesson-progress query so no cross-account bleed.
- One-time client migration: on first mount with a session, if the legacy `localStorage.completedLessons` exists, drop it (do NOT import — server is now source of truth; users just re-complete or an admin can backfill).

### 5. Data cleanup (in the same migration)

- `update profiles set tier_state='foundation' where user_id='ee1dbf66-8981-4ad1-ac33-2a253ede224d';`
- Also reset any profile with `tier_state <> 'foundation'` where no passing `quiz_attempts` exists (broader audit fix — matches the prompt's audit query).

### 6. Publish + verify on Published tab

Playwright script from the sandbox against the published URL:
- (a) Sign in as account A that just graduated → sign out → sign in as fresh account B in same browser context → confirm Foundation shows 0/N and `/simulator` route is gated.
- (b) In DevTools console via Playwright, `localStorage.setItem('completedLessons', JSON.stringify([...]))` and attempt a direct `supabase.from('profiles').update({tier_state:'tier1'})` — confirm both fail to unlock (RLS rejects the update; UI still shows locked).
- (c) Complete lessons + pass quiz on account B → `graduate_foundation()` succeeds → Simulator unlocks.

## Technical details

**Files touched:**
- New migration (table + RLS + `graduate_foundation` fn + profiles UPDATE policy tightening + data cleanup)
- New: `src/hooks/useLessonProgress.ts`, `src/hooks/useGraduateFoundation.ts`
- Edited: `src/pages/learning/FoundationLesson.tsx`, `src/components/learning/TierLessonList.tsx`, `src/components/dashboard/LearningProgressCard.tsx`, `src/contexts/AuthContext.tsx`

**Not touched:** tier2/tier3 promotion logic, simulator/strategies/analytics gating (already reads `tier_state` from server via `TierContext`), quiz flow itself.

**Risk:** existing users who legitimately completed Foundation via localStorage will lose visible progress until they re-complete lessons (server has no record). Acceptable — same fix the prompt specifies, and `starter@gmail.com`-class accounts are the target. Existing users already at `tier_state='tier1'+` with passing quiz attempts are unaffected (only the illegitimate ones get reset by the audit query).

## Report format

Will end with the exact `foundation-gate-fix — Completed` line and the three-item report.
