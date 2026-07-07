## Split-bucket hardening for lesson media (v5 — final, Zod fix)

Only **guru class media** goes private/signed. Platform Tier 1/2/3 lessons stay on the public bucket (progression-gated funnel). SQL-side `LIKE … ESCAPE '\'` is the authoritative defense against wildcard metacharacters in paths; the edge validator rejects only characters that are never valid in a storage path.

**Preflight confirmed:** `lesson-assets` has **0 objects** and **0 lesson rows** reference it. A final re-check is a **hard gate** immediately before the migration executes.

---

## What changes

### 1. Buckets
- **`lesson-assets`** — stays **public**. All platform lessons (Foundation + Tier 1/2/3), marketing. Scanner may re-flag it as public — expected and documented in security memory.
- **`lesson-assets-private`** — **new**, **private**. Guru class media only. Paid gate = `class_enrollments.status = 'active'`.

### 2. Storage RLS on `lesson-assets-private`
- **Write:** owner-only — `(storage.foldername(name))[1] = auth.uid()::text`. Matches SlideImportDialog's `{user_id}/{lessonFolderId}/…` layout.
- **Read:** denied to `anon` and `authenticated`. Reads happen only via signed URLs from the edge function.
- `service_role`: full access for edge functions and cleanup.

### 3. Slides JSON marker format — **stable contract**
Every private slide reference is stored as a JSON **string value** exactly matching:

```
"private://<user_id>/<lesson_folder_id>/<filename>"
```

- Always `private://` scheme; byte-for-byte equal to the storage path passed to `.upload()`.
- Public slides continue to store a full `https://…lesson-assets/…` URL. Anything not starting with `private://` is treated as public and passed through unchanged.
- The follow-up normalized `lesson_assets(path, lesson_id, class_id)` table (see §7) MUST derive `path` from this marker (minus the `private://` scheme) — no reformatting.

### 4. Entitlement gate

```sql
CREATE OR REPLACE FUNCTION public.can_access_guru_asset(
  _user_id uuid,
  _path    text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_escaped  text;
BEGIN
  IF _user_id IS NULL OR _path IS NULL OR _path = '' THEN
    RETURN false;
  END IF;

  -- (a) Owner of the folder wins (guru editing own material).
  IF (string_to_array(_path, '/'))[1] = _user_id::text THEN
    RETURN true;
  END IF;

  -- (b) Authoritative check: locate the guru lesson whose slides JSON
  -- references this exact path via the "private://<path>" marker.
  -- Escape LIKE metacharacters so filenames containing %/_ still match literally
  -- and a crafted path cannot wildcard the pattern.
  v_escaped := replace(replace(replace(_path, '\', '\\'), '%', '\%'), '_', '\_');

  SELECT l.class_id
  INTO v_class_id
  FROM public.lessons l
  WHERE l.content_type = 'guru'
    AND l.is_published = true
    AND l.slides::text LIKE '%"private://' || v_escaped || '"%' ESCAPE '\'
  LIMIT 1;

  IF v_class_id IS NULL THEN
    RETURN false;
  END IF;

  -- (c) Active enrollment in the owning class.
  RETURN EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.class_id = v_class_id
      AND ce.student_id = _user_id
      AND ce.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_guru_asset(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.can_access_guru_asset(uuid, text) TO service_role;
```

All must-fixes folded: takes `_user_id` explicitly (no `auth.uid()` in service-role context), resolves a real lesson row that references the exact path (no path-parsing to authority), `SET search_path = public`. `getClaims(jwt)` in `@supabase/supabase-js` v2 cryptographically verifies the JWT signature against the project JWKS.

### 5. Signed-URL edge function

`supabase/functions/sign-guru-asset/index.ts`:
- CORS via `npm:@supabase/supabase-js@2/cors`.
- JWT verification via `supabase.auth.getClaims(token)`; `userId = claims.sub`.
- Input validation — **rejects only characters that are never valid in a storage path**; `%` and `_` are allowed because they're common in filenames and the SQL `ESCAPE '\'` neutralizes them:

  ```ts
  const PathSchema = z.string()
    .min(1).max(512)
    .refine(p => !p.includes('..'),       'path traversal not allowed')
    .refine(p => !p.startsWith('/'),      'leading slash not allowed')
    .refine(p => !/[\s\x00-\x1f]/.test(p), 'whitespace or control character not allowed')
    .refine(p => !p.includes('\\'),        'backslash not allowed');

  const BodySchema = z.object({ paths: z.array(PathSchema).min(1).max(50) });
  ```

  SQL-side `ESCAPE '\'` in §4 is the authoritative defense against LIKE metacharacters — the edge validator is not repeating that job.
- For each path: `can_access_guru_asset(userId, path)` via service-role client, then `createSignedUrl(path, 300)` for allowed paths.
- Response: `{ signed: Record<path, { url, expiresAt }>, denied: string[] }`.

**TTL 300s (5 min).**

### 6. Client changes
- **`SlideImportDialog.tsx`** — new prop `isPrivate: boolean`. When `true`: upload to `lesson-assets-private`, store `image_url = 'private://' + storagePath` (byte-for-byte the path passed to `.upload()`).
- **`GuruLessonFormPage.tsx`** — passes `isPrivate={true}`.
- **`useGuruLessons.ts`** — cleanup lists/removes under `{user_id}/{lessonId}/` from **both** buckets.
- **`useSignedGuruAssets(paths[])`** — React Query hook. `staleTime: 3 * 60 * 1000`, `refetchInterval: 3.5 * 60 * 1000` so URLs rotate ~90s before the 5-min TTL expires. Key `['guru-signed-urls', lessonId, userId]`.
- **`LessonRenderer.tsx` / `StudentLessonPage.tsx`** — collect all `private://…` paths from current lesson slides in one call. Render `<img src={resolved[path] ?? previousResolved.current[path]}>` and update `previousResolved` after each successful refetch — seamless mid-view URL swap.

### 7. Follow-up filed (not a blocker)
`docs/FOLLOWUP_lesson_assets_index.md` — normalized `lesson_assets(path, lesson_id, class_id)` with index on `path`, populated in `useSaveGuruLesson`. Preserves the `private://<path>` marker as source of truth. Swap `can_access_guru_asset` to indexed lookup once table exists.

### 8. Security finding + memory
- Mark `lesson_assets_bucket_open_read` as **fixed** — sensitive (enrollment-gated) media relocated; `lesson-assets` intentionally public for platform/marketing.
- Update `mem://security-memory`: two-bucket model, platform tier funnel is progression-gated (not paywalled), future re-flags on `lesson-assets` are expected, `private://<path>` marker is a stable contract.

### 9. Publish
Build green → `preview_ui--publish` → multi-reload check on published URL.

---

## Execution ordering

1. **Empty-bucket re-check as hard gate** — two SELECTs. Nonzero → stop and re-scope.
2. `supabase--storage_create_bucket lesson-assets-private public=false`.
3. `supabase--migration` (function + storage RLS) → **you review and approve**.
4. Edge function.
5. Client code.
6. Mark finding fixed; update security memory.
7. Publish.

## Files touched

```text
NEW  supabase/functions/sign-guru-asset/index.ts
NEW  src/hooks/useSignedGuruAssets.ts
NEW  docs/FOLLOWUP_lesson_assets_index.md
EDIT src/components/guru/SlideImportDialog.tsx    (isPrivate prop, marker storage)
EDIT src/pages/guru/GuruLessonFormPage.tsx       (isPrivate=true)
EDIT src/hooks/useGuruLessons.ts                  (dual-bucket cleanup)
EDIT src/components/learning/LessonRenderer.tsx   (private:// resolution + no-flicker swap)
EDIT src/pages/StudentLessonPage.tsx              (wire useSignedGuruAssets)
DB   migration (user-approved): can_access_guru_asset + storage.objects RLS on lesson-assets-private
TOOL supabase--storage_create_bucket lesson-assets-private (public=false)
TOOL security--manage_security_finding: mark_as_fixed
TOOL security--update_memory
TOOL preview_ui--publish
```

## Out of scope
- Platform Tier 1/2/3 slides — public bucket.
- Foundation, marketing, avatars — unchanged.
- `investor-docs` — unchanged.
- Normalized `lesson_assets` index — follow-up doc.
- No data migration — bucket confirmed empty; hard-gated re-check before step 2.
