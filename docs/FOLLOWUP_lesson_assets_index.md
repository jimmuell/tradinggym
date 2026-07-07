# Follow-up: normalized `lesson_assets` index table

**Status:** deferred. Not a blocker today; do this before guru media grows past
~a few thousand paths.

## Why

`public.can_access_guru_asset(_user_id, _path)` currently locates the owning
lesson with:

```sql
SELECT l.class_id
FROM public.lessons l
WHERE l.content_type = 'guru'
  AND l.is_published = true
  AND l.slides::text LIKE '%"private://' || v_escaped || '"%' ESCAPE '\'
LIMIT 1;
```

That is a full-table scan over `lessons` per path, called up to 50 times per
lesson load by the `sign-guru-asset` edge function. Fine at today's volume;
will not scale.

## Plan

1. New table:

   ```sql
   CREATE TABLE public.lesson_assets (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
     class_id   uuid REFERENCES public.classes(id) ON DELETE CASCADE,
     path       text NOT NULL UNIQUE,
     created_at timestamptz NOT NULL DEFAULT now()
   );
   CREATE INDEX lesson_assets_path_idx    ON public.lesson_assets (path);
   CREATE INDEX lesson_assets_lesson_idx  ON public.lesson_assets (lesson_id);

   GRANT SELECT ON public.lesson_assets TO authenticated;
   GRANT ALL    ON public.lesson_assets TO service_role;
   ALTER TABLE public.lesson_assets ENABLE ROW LEVEL SECURITY;
   -- No policies for authenticated; reads happen only via SECURITY DEFINER
   -- functions and edge functions using service_role.
   ```

2. Populate in `useSaveGuruLesson`: on every save, diff current `private://`
   paths against the existing `lesson_assets` rows for that lesson id; insert
   new, delete removed. `path` is derived from the slides JSON marker with the
   `private://` prefix stripped — **byte-for-byte identical** to the storage
   path passed to `.upload()`, per the stable marker contract.

3. Swap `can_access_guru_asset` branch (b) to an indexed lookup:

   ```sql
   SELECT la.class_id
   INTO v_class_id
   FROM public.lesson_assets la
   JOIN public.lessons l ON l.id = la.lesson_id
   WHERE la.path = _path
     AND l.content_type = 'guru'
     AND l.is_published = true
   LIMIT 1;
   ```

   No `LIKE`, no escaping, no scan. Removes the last runtime dependency on
   parsing `slides::text`.

## Do NOT

- Do not change the `private://<path>` marker format in the slides JSON.
  The client renderer, the migration path, and the future backfill all depend
  on it.
- Do not derive `path` from anything other than the marker (e.g. do not
  reconstruct from `{user_id}/{lesson_id}/{filename}`) — the upload path is
  the source of truth.
