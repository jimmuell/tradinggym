
Add three temporary `console.log` statements inside `useStudentEnrollments` queryFn in `src/hooks/useStudentEnrollments.ts`:

1. After fetching `enrollments` — log `[useStudentEnrollments] enrollments:` with raw rows + error.
2. After fetching `classes` — log `[useStudentEnrollments] classes:` with raw rows + the `classIds` requested.
3. Before returning the mapped array — log `[useStudentEnrollments] mapped result:` with the final array.

Also add a log in `useStudentClass` showing the requested `classId`, the count of enrollments, and whether a match was found, so it's clear whether the lookup is failing at the DB query or at the client-side `.find()`.

No other behavior changes. Logs are clearly prefixed `[useStudentEnrollments]` / `[useStudentClass]` for easy removal later.
