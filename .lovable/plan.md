
The user wants to clean up test enrollment data. This requires:
1. DELETE on `cohort_enrollments` — but the table has no DELETE policy (RLS blocks user deletes), so this needs a migration to run as service role.
2. UPDATE on `profiles` — also blocked by RLS (no UPDATE policy for users).

Both are data operations, but per the instructions, data UPDATE/DELETE on RLS-protected tables where no policy exists must go through a migration (since the insert tool is select+insert only).

## Plan

Run a one-shot SQL migration that:

1. `DELETE FROM cohort_enrollments WHERE id = '8b9f978a-a06d-4d36-b6bc-7855727ac596';`
2. `UPDATE profiles SET referral_source = NULL, referred_by_guru_id = NULL WHERE user_id = 'a9aadb3a-9be2-4f15-acc3-52a0bf4fcbc3';`

No schema changes. No code changes. No RLS policy changes.

After execution, verify with a SELECT to confirm both rows reflect the cleanup.
