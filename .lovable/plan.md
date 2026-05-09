## Goal

On `/admin/content/course/:courseId/preview`, make it obvious that each lesson row inside a chapter is the click target that launches the lesson preview.

## Change

File: `src/pages/admin/AdminCoursePreviewPage.tsx`

Restyle the lesson `<button>` inside each chapter's `AccordionContent` so it reads unmistakably as an interactive card-button.

Per row:
- Bordered card look: `border border-border rounded-md bg-card`
- Hover affordance: `hover:bg-accent hover:border-primary/50 transition-colors`
- Subtle shadow lift on hover: `hover:shadow-sm`
- Increase vertical padding (`py-3`) and keep `px-3`
- Left side: `BookOpen` icon + lesson title + optional `Draft` badge (unchanged)
- Right side: replace lone `ChevronRight` with a labeled cue — small muted text `Open lesson` followed by `ChevronRight`, grouped together so the action is explicit
- Keep the entire row as a single `<button>` so the whole area remains the click target
- Use `flex flex-col gap-2` on the lesson list so each row is visually separated rather than stacked tightly

No changes to data fetching, routing, QuizRunner, LessonRenderer, or chapter accordion behavior. Quiz card already has an explicit "Preview Quiz" button — leave it as-is for consistency with the new affordance.

## Why this over a badge

A badge next to the chapter title would imply the chapter itself launches something, but chapters group multiple lessons. Treating each lesson row as a real button keeps a 1:1 mapping between the visible item and what gets previewed, and the entire row stays clickable (better hit target than a small badge).
