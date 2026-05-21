# Content Manager — Standalone App Specification

> A self-contained spec for rebuilding the **Content Manager** (admin
> authoring tool for a 3-level learning hierarchy) as a standalone web
> application. No access to the originating project is required to
> implement what is described here.
>
> **Audience:** AI agent or engineer bootstrapping the app from scratch.
> **Stack assumed:** React + Vite + TypeScript + Tailwind + shadcn/ui +
> TanStack Query + React Router + Supabase (Auth / Postgres / Storage).
> Any equivalent stack works as long as the schema, RLS, and route
> contracts in this document are honored.

---

## 1. Overview

The Content Manager is an **admin-only authoring tool** that produces
structured learning content consumed by a separate "student" application.

### Hierarchy

```text
Course (1) ──< Chapter (N) ──< Lesson (N)
   │                                │
   │                                └── ordered Slides[]   (JSONB)
   └── (1) Quiz                          │
            └── ordered Questions[]      └── one quiz per course
                       (JSONB)               (course-level, not per-lesson)
```

- **Course** — top-level unit, gated by a `tier_required` (Foundation /
  Tier 1 / Tier 2 / Tier 3).
- **Chapter** — ordered grouping inside a course.
- **Lesson** — ordered learning unit inside a chapter; its content is an
  ordered array of slides (text or imported image).
- **Quiz** — one optional quiz per course; A/B/C/D questions with
  explanation and a configurable pass threshold.

### Content scoping

Two `content_type` values share the schema:

| content_type | Authored by | Visibility            | Notes                                |
| ------------ | ----------- | --------------------- | ------------------------------------ |
| `platform`   | Admin       | All authenticated users when `is_published = true` | This spec focuses on the platform side. |
| `guru`       | Guru users  | Students enrolled in the linked `class_id` | Parallel scope; out of scope for v1. |

The Content Manager UI in this spec administers **platform** content
only. The schema is designed so a guru-side authoring UI can be added
later without migrations.

### Who uses it

- **Admins** (`profiles.plan_state = 'admin'`) — full CRUD on all
  platform courses/chapters/lessons/quizzes.
- **Students** — read-only consumption of `is_published = true` content
  via the student app (not part of this spec).

---

## 2. Tech assumptions

| Concern        | Default                                                   |
| -------------- | --------------------------------------------------------- |
| Framework      | React 18 + Vite + TypeScript                              |
| Routing        | React Router v6                                           |
| Styling        | Tailwind v3/v4 + shadcn/ui components, semantic tokens    |
| Data fetching  | TanStack Query v5                                         |
| Forms          | Controlled React state (no form lib needed)               |
| Toasts         | `sonner`                                                  |
| Backend        | Supabase: Postgres + Row-Level Security, Auth, Storage    |
| PDF rendering  | `pdfjs-dist` (slide import from PDF, client-side)         |
| Auth methods   | Email + password and/or Google OAuth                      |

The schema/RLS contract is the binding part. The frontend choices are
recommendations; any framework that can issue authenticated Postgres
calls via the Supabase JS SDK will work.

---

## 3. Database schema

All tables live in `public`. All have RLS enabled. JSON content is
stored in `jsonb`. `id` is `uuid default gen_random_uuid()` everywhere.

### 3.1 `profiles`

Every authenticated user has exactly one row. Admin role is determined
by `plan_state = 'admin'`. (Historically also `role = 'admin'`; the
**Content Manager RLS uses `plan_state`**.)

```sql
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique,           -- references auth.users(id)
  display_name  text,
  avatar_url    text,
  plan_state    text not null default 'starter',-- 'starter'|'pro'|'expert'|'guru'|'admin'
  tier_state    text not null default 'foundation',
  role          text not null default 'user',   -- 'user'|'admin'|'guru'|'investor'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;
```

Auto-create a profile when a new auth user is inserted:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Promote a user to admin manually (Supabase SQL editor):

```sql
update public.profiles set plan_state = 'admin', role = 'admin' where user_id = '<uuid>';
```

### 3.2 `courses`

```sql
create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  content_type   text not null default 'platform',  -- 'platform' | 'guru'
  tier_required  text not null default 'foundation',-- 'foundation'|'tier1'|'tier2'|'tier3'
  display_order  int  not null default 0,           -- sort key in course list
  is_published   boolean default true,              -- admin can save unpublished drafts
  author_id      uuid,                              -- null for platform, guru user_id for guru
  class_id       uuid,                              -- null for platform, links to guru's class
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.courses enable row level security;
create index courses_content_type_pub_idx on public.courses(content_type, is_published);
```

### 3.3 `chapters`

```sql
create table public.chapters (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null,                    -- references courses(id) logically
  title          text not null,
  description    text,
  display_order  int  not null default 0,          -- 1-based; see "Ordering" §3.7
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.chapters enable row level security;
create index chapters_course_order_idx on public.chapters(course_id, display_order);
```

> No FK constraint is required on `course_id`; the admin delete flow
> handles cascade in code (see §3.8). You may add `references courses(id)
> on delete cascade` if you prefer DB-enforced cascade.

### 3.4 `lessons`

```sql
create table public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  chapter_id         uuid,                          -- null tolerated for legacy data
  title              text not null,
  description        text,
  module             text not null,                 -- legacy taxonomy, see §5
  module_order       int  not null default 0,       -- "Lesson #" within chapter
  tier_required      text not null default 'foundation',
  content_type       text not null default 'platform',
  author_id          uuid,                          -- null for platform
  class_id           uuid,                          -- null for platform
  slides             jsonb not null default '[]',   -- ordered slide array, shape §3.6
  estimated_minutes  int  default 10,
  is_published       boolean default true,          -- false = draft
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.lessons enable row level security;
create index lessons_chapter_order_idx on public.lessons(chapter_id, module_order);
create index lessons_module_idx on public.lessons(module);
```

### 3.5 `quizzes` + `quiz_attempts`

```sql
create table public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid,                          -- one quiz per course (platform)
  lesson_id       uuid,                          -- legacy/per-lesson quizzes (null for new)
  module          text not null,                 -- derived from course tier, see §5
  title           text not null,
  pass_threshold  int  not null default 80,      -- 0–100
  content_type    text not null default 'platform',
  author_id       uuid,                          -- null for platform
  questions       jsonb not null default '[]',   -- ordered question array, shape §3.6
  is_published    boolean default true,
  created_at      timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create index quizzes_course_idx on public.quizzes(course_id);

create table public.quiz_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  quiz_id          uuid not null,
  score            int  not null,                -- 0–100 percentage
  total_questions  int  not null,
  passed           boolean not null,
  answers          jsonb not null default '[]',  -- [{question_id, selected_index, correct}]
  responses        jsonb not null default '[]',  -- full per-question payload (optional)
  completed_at     timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
```

### 3.6 JSONB shapes

These shapes are the contract between author and reader. Keep them
stable; add new optional fields rather than renaming.

```ts
// lessons.slides : LessonSlide[]
export interface LessonSlide {
  id: string;                 // crypto.randomUUID()
  title: string;              // required
  body: string;               // markdown/plain text; "" allowed for imported slides
  bullet_points?: string[] | null;
  tip?: string | null;
  image_key?: string | null;  // legacy
  image_url?: string | null;  // public URL of an uploaded slide image
  type?: 'imported' | null;   // 'imported' marks PDF/image-import slides
}

// quizzes.questions : QuizQuestion[]
export interface QuizQuestion {
  id: string;                 // crypto.randomUUID()
  question: string;
  options: [string, string, string, string]; // exactly 4 (A/B/C/D)
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;        // shown after answering
  // optional provenance for AI-generated questions:
  source_lesson_id?: string | null;
  source_lesson_title?: string | null;
  source_slide_index?: number | null;
}

// quiz_attempts.answers : QuizAnswer[]
export interface QuizAnswer {
  question_id: string;
  selected_index: number;
  correct: boolean;
}
```

**Example `slides`:**

```json
[
  {
    "id": "8c3a...",
    "title": "Reading the Tape",
    "body": "Tape reading is the practice of...",
    "bullet_points": ["Watch print size", "Watch absorption", "Confirm with delta"],
    "tip": "If volume dries up at a level, the move is likely done."
  },
  {
    "id": "1f9b...",
    "title": "Slide 2",
    "body": "",
    "image_url": "https://<project>.supabase.co/storage/v1/object/public/lesson-assets/<user_id>/<lessonFolderId>/slide-...png",
    "type": "imported"
  }
]
```

**Example `questions`:**

```json
[
  {
    "id": "a7...",
    "question": "What does VWAP stand for?",
    "options": [
      "Volume-Weighted Average Price",
      "Variable Weighted Asset Premium",
      "Volatility-Weighted Adjusted Price",
      "None of the above"
    ],
    "correct_index": 0,
    "explanation": "VWAP weights each trade by its volume to compute the session's average price."
  }
]
```

### 3.7 Ordering semantics

- `courses.display_order` — admin sets it explicitly; lowest first. New
  course defaults to `max(display_order) + 1`.
- `chapters.display_order` — **1-based** within a course. On insert at
  position N, **shift all siblings with `display_order >= N` up by 1**
  before inserting (see §6.4). On reorder, perform a two-step swap with
  the neighbor (there is no unique constraint, so simple updates work).
- `lessons.module_order` — **1-based** "Lesson #" within a chapter. The
  default editor suggests `(count of lessons in chapter) + 1`. Duplicates
  are tolerated but discouraged.

### 3.8 Cascade behavior

If you do **not** add ON DELETE CASCADE FKs, mirror this admin delete
order in application code (already encoded in the admin delete RPC):

```text
quiz_attempts → lessons (by chapter) → quizzes (by course) → chapters → courses
```

Recommended FK-based alternative:

```sql
alter table public.chapters add constraint chapters_course_fk
  foreign key (course_id) references public.courses(id) on delete cascade;
alter table public.lessons add constraint lessons_chapter_fk
  foreign key (chapter_id) references public.chapters(id) on delete set null;
alter table public.quizzes add constraint quizzes_course_fk
  foreign key (course_id) references public.courses(id) on delete cascade;
```

The reference app uses **`on delete set null`** for `lessons.chapter_id`
so that deleting a chapter unlinks its lessons (they can be reassigned)
rather than destroying authored content. The chapter-delete confirmation
dialog tells the admin this.

---

## 4. Authorization (RLS)

Enable RLS on every table. The contract:

| Role          | courses                | chapters               | lessons                | quizzes                | quiz_attempts        |
| ------------- | ---------------------- | ---------------------- | ---------------------- | ---------------------- | -------------------- |
| Admin         | full CRUD              | full CRUD              | full CRUD              | full CRUD              | n/a                  |
| Guru (owner)  | CRUD on own `guru`     | CRUD on chapters of own guru courses | CRUD on own `guru` lessons | CRUD on own `guru` quizzes | n/a |
| Student (enrolled) | read published `guru` of enrolled class | same | same | same | own attempts only |
| Anon/authn.    | read published `platform` | read chapters of published platform courses | read published platform lessons | read published platform quizzes | none |

### 4.1 Helper functions

```sql
-- Stable, SECURITY DEFINER so it bypasses caller RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'
  );
$$;

-- For guru/student scoping only. Define if you implement guru content.
create or replace function public.student_is_enrolled_in_class(_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_enrollments
    where class_id = _class_id and student_id = auth.uid() and status = 'active'
  );
$$;
```

### 4.2 Policies — `courses`

```sql
create policy admin_select_courses on public.courses for select
  using (exists (select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'));
create policy admin_insert_courses on public.courses for insert
  with check (exists (select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'));
create policy admin_update_courses on public.courses for update
  using (exists (select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'))
  with check (exists (select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'));
create policy admin_delete_courses on public.courses for delete
  using (exists (select 1 from public.profiles
    where user_id = auth.uid() and plan_state = 'admin'));

create policy select_published_platform_courses on public.courses for select
  using (content_type = 'platform' and is_published = true);
```

### 4.3 Policies — `chapters`

```sql
create policy admin_select_chapters on public.chapters for select using (public.is_admin());
create policy admin_insert_chapters on public.chapters for insert with check (public.is_admin());
create policy admin_update_chapters on public.chapters for update using (public.is_admin()) with check (public.is_admin());
create policy admin_delete_chapters on public.chapters for delete using (public.is_admin());

create policy select_platform_chapters on public.chapters for select
  using (exists (
    select 1 from public.courses
    where courses.id = chapters.course_id
      and courses.content_type = 'platform'
      and courses.is_published = true
  ));
```

### 4.4 Policies — `lessons`

```sql
create policy admin_select_all_lessons on public.lessons for select using (public.is_admin());
create policy admin_insert_platform_lessons on public.lessons for insert with check (public.is_admin());
create policy admin_update_platform_lessons on public.lessons for update using (public.is_admin()) with check (public.is_admin());
create policy admin_delete_platform_lessons on public.lessons for delete using (public.is_admin());

create policy lessons_select_platform on public.lessons for select to authenticated
  using (content_type = 'platform' and is_published = true);
```

### 4.5 Policies — `quizzes` + `quiz_attempts`

```sql
create policy admin_select_all_quizzes on public.quizzes for select using (public.is_admin());
create policy admin_insert_platform_quizzes on public.quizzes for insert with check (public.is_admin());
create policy admin_update_platform_quizzes on public.quizzes for update using (public.is_admin()) with check (public.is_admin());
create policy admin_delete_platform_quizzes on public.quizzes for delete using (public.is_admin());

create policy quizzes_select_platform on public.quizzes for select to authenticated
  using (content_type = 'platform' and is_published = true);

create policy quiz_attempts_insert_own on public.quiz_attempts for insert to authenticated
  with check (auth.uid() = user_id);
create policy quiz_attempts_select_own on public.quiz_attempts for select to authenticated
  using (auth.uid() = user_id);
```

### 4.6 Storage bucket

Create a **public** bucket `lesson-assets` for slide images. Path
convention: `{user_id}/{lessonFolderId}/{filename}`. Policies:

```sql
insert into storage.buckets (id, name, public) values ('lesson-assets', 'lesson-assets', true)
  on conflict (id) do nothing;

create policy "Lesson assets are publicly readable"
  on storage.objects for select using (bucket_id = 'lesson-assets');

create policy "Authenticated users can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Authenticated users can delete their own assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 5. Module taxonomy (legacy, but required)

`lessons.module` and `quizzes.module` are legacy text discriminators
used by the student app. The Content Manager **derives** them at save
time from `(course.tier_required, chapter.display_order)`:

```ts
function deriveLessonModule(tier: string, chapterOrder: number): string {
  if (tier === 'foundation') return `f${chapterOrder}_custom`;
  if (tier === 'tier1') return 'tier1_orb';
  if (tier === 'tier2') return 'tier2_vwap';
  if (tier === 'tier3') return 'tier3_amd';
  return 'platform_custom';
}

function deriveQuizModule(tier: string): string {
  if (tier === 'foundation') return 'foundation';
  if (tier === 'tier1') return 'tier1_orb';
  if (tier === 'tier2') return 'tier2_vwap';
  if (tier === 'tier3') return 'tier3_amd';
  return 'platform_custom';
}
```

Canonical foundation modules used by seed data:
`f1_candles`, `f2_structure`, `f3_sessions`, `f4_risk`, `f5_plan`.
The quiz module filter in the list page uses these exact strings.

---

## 6. UI surface

All routes are admin-gated. A non-admin hitting any `/admin/content/*`
route should be redirected to `/` (or wherever your app sends them).

```text
/admin/content                                       # Tabs: Courses | Quizzes
/admin/content/course/new                            # Create course
/admin/content/course/:courseId                      # Course detail (chapters + lessons + quiz)
/admin/content/course/:courseId/edit                 # Edit course metadata
/admin/content/course/:courseId/chapter/new          # New chapter (dedicated page, see §6.4)
/admin/content/lesson/new?chapterId=&courseId=       # New lesson (requires chapter context)
/admin/content/lesson/:lessonId                      # Edit lesson
/admin/content/quiz/new?courseId=                    # New course quiz
/admin/content/quiz/:quizId                          # Edit quiz
```

The admin role check uses a hook like:

```ts
function useUserRole() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plan_state, role')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });
  return { isAdmin: data?.plan_state === 'admin', isLoading };
}
```

### 6.1 `/admin/content` — Content Manager landing

**Tabs:** `Courses` (default), `Quizzes`.

**Courses table columns:** Order · Course (title + 1-line description)
· Tier badge · Chapters count · Lessons count · Status (Published/Draft
badge) · Updated (relative time) · Actions (pencil → edit, Manage →
detail).

Query:

```ts
supabase.from('courses')
  .select('id, title, description, tier_required, display_order, is_published, updated_at, chapters ( id, lessons:lessons ( id ) )')
  .eq('content_type', 'platform')
  .order('display_order', { ascending: true });
```

**Quizzes table columns:** Module badge · Title · Questions count ·
Pass % · Published · Created · Actions (Edit).

Filter dropdown above the table: All / Foundation / Tier 1 — Price
Action / Tier 2 — Confirmation / Tier 3 — Institutional. The value
matches `quizzes.module` exactly.

**Top-right CTA:** `+ New Course` → `/admin/content/course/new`.
On Quizzes tab: `+ New Quiz` → `/admin/content/quiz/new`.

### 6.2 `/admin/content/course/new` and `/:courseId/edit`

Single form (`AdminCourseFormPage`). Fields:

| Field          | Control       | Notes                                                        |
| -------------- | ------------- | ------------------------------------------------------------ |
| Title *        | Text          | Required.                                                    |
| Description    | Textarea      | Max 500 chars; live counter.                                  |
| Tier Required *| Select        | foundation / tier1 / tier2 / tier3.                          |
| Display Order *| Number        | New: defaults to `max + 1`. Edit: shows current.             |
| Published      | Switch        | Off = draft.                                                 |

Footer: `Save Draft` is implicit (Published off). Primary CTA is
`Create Course` (new) or `Save Changes` (edit). Edit mode also shows
`Delete Course` (destructive, with AlertDialog).

On insert: `content_type = 'platform'`, `author_id = null`,
`class_id = null`. On success → navigate to `/admin/content/course/:id`.

### 6.3 `/admin/content/course/:courseId` — Detail

Header card: title + description + Tier badge + Published badge +
`Preview` + `Edit` (→ `/edit`).

**Chapters section.** For each chapter:

- Collapsible row showing `Chapter N · Title`, description line, lesson
  count badge, and action buttons:
  - **Up / Down arrows** — two-step swap with neighbor:
    ```ts
    // Step 1: this row → neighbor's order
    await supabase.from('chapters').update({ display_order: neighbor.display_order }).eq('id', this.id);
    // Step 2: neighbor → this row's old order
    await supabase.from('chapters').update({ display_order: this.display_order }).eq('id', neighbor.id);
    ```
  - **Pencil** — inline edit (title, description, order).
  - **Trash** — destructive AlertDialog; copy: "Lessons in this chapter
    will be unlinked (not deleted) and can be reassigned later."
- Expanded body: Table of lessons (`#`, Title, Slides count, Est. Time,
  Status, Actions[Edit]) + `+ Add Lesson` footer button that links to
  `/admin/content/lesson/new?chapterId={ch.id}&courseId={courseId}`.

**`+ Add Chapter` button** (top of chapters section) → routes to the
dedicated New Chapter page (§6.4), not an inline form.

**Quiz section.** If no quiz exists for `course_id`: shows empty card
with `+ Add Quiz` → `/admin/content/quiz/new?courseId={courseId}`. If a
quiz exists: shows title + questions count + pass threshold + Edit link
to `/admin/content/quiz/:quizId`.

### 6.4 `/admin/content/course/:courseId/chapter/new` — New Chapter

Dedicated page (not inline) to give room for a **placement preview**.

Fields:

| Field        | Control       | Notes                                                                 |
| ------------ | ------------- | --------------------------------------------------------------------- |
| Title *      | Text          | Autofocused.                                                          |
| Description  | Textarea      | Optional.                                                             |
| Position     | Number        | Default = `max(display_order) + 1`. Clamped to `[1, totalAfter]`.    |

**Live placement preview card** below the form: renders the existing
sorted chapters with a **highlighted "New chapter" row** inserted at
the chosen Position, so the admin can confirm ordering before saving.

**Save flow (critical):**

```ts
// 1. Shift down siblings at or after the chosen position
//    (skip if appending at the end). Update largest → smallest to avoid
//    transient duplicates (no unique constraint, but cleaner this way).
if (insertOrder <= chapters.length) {
  const toShift = chapters
    .filter(c => c.display_order >= insertOrder)
    .sort((a, b) => b.display_order - a.display_order);
  for (const row of toShift) {
    await supabase.from('chapters')
      .update({ display_order: row.display_order + 1 })
      .eq('id', row.id);
  }
}

// 2. Insert the new chapter
await supabase.from('chapters').insert({
  course_id: courseId,
  title: title.trim(),
  description: description.trim() || null,
  display_order: insertOrder,
});
```

After success → invalidate `['admin-content-course', courseId]` and
navigate back to the course detail page.

### 6.5 `/admin/content/lesson/new` and `/:lessonId`

Single form (`AdminLessonFormPage`). New mode **requires** `chapterId`
and `courseId` query params. If missing → render guidance and link back
to `/admin/content`.

**Header breadcrumb:** `Content → {course.title} → Chapter N: {chapter.title}`.

**Lesson Details card:**

- Title * (text)
- Lesson # (number) — defaults to `(lesson count in chapter) + 1`
- Description (text, max 200 chars)
- Estimated time (number, minutes)

**Slides card:** Toolbar with `Import Slides` (opens import dialog,
§7) and `Add Slide`. Each slide is a Collapsible item with:

- Slide N: Title preview, `(imported)` tag if applicable
- Move Up / Down / Delete (delete disabled when only one slide remains)
- Body fields:
  - If imported: show the image, label body field "Notes (optional)"
  - Otherwise: Title *, Body, Bullet points (one per line), Tip

**Preview button** opens a dialog rendering the slides with a
`LessonRenderer`-style component (your own simple renderer: title +
optional image + body + bullets + tip).

**Footer:** `Delete Lesson` (edit only, destructive) · `Save Draft`
(sets `is_published=false`) · `Publish` (sets `is_published=true`).

**Save payload (insert):**

```ts
await supabase.from('lessons').insert({
  title: title.trim(),
  description: description.trim() || null,
  chapter_id,                            // from URL
  module: deriveLessonModule(tier, chapter.display_order),
  module_order: lessonNumber,
  tier_required: tier,                   // from chapter.course.tier_required
  estimated_minutes,
  is_published: publish,
  slides: JSON.parse(JSON.stringify(slides)), // strip TS `never` poisoning
  content_type: 'platform',
  author_id: null,
  class_id: null,
});
```

**Save payload (update):** Only the mutable fields — never resend
`content_type`/`author_id`/`class_id` on update.

```ts
await supabase.from('lessons').update({
  title, description, module_order, estimated_minutes, is_published, slides,
}).eq('id', lessonId);
```

After success → navigate back to `/admin/content/course/{courseId}`.

### 6.6 `/admin/content/quiz/new` and `/:quizId`

Single form (`AdminQuizFormPage`). New mode reads `courseId` from query
string (required to derive `module`).

**Header breadcrumb:** `Content → {course.title} → Quiz`.

**Quiz Details card:** Title * · Pass threshold (%) (default 80, 0–100).

**Questions card:** `Add Question` button. Each question:

- Trash button (disabled when only one question remains)
- Question textarea
- RadioGroup of four options (A/B/C/D), each row = radio + letter + input
- Explanation textarea

**Validation** (block save with toast on failure):

- Title required
- Pass threshold 0–100
- Each question: text required, all 4 options non-empty, explanation required

**Preview dialog:** Shows pass threshold, then each question with all
options and a ✓ + green color on the correct one, plus the explanation.

**Save payload (insert):**

```ts
await supabase.from('quizzes').insert({
  title: title.trim(),
  module: deriveQuizModule(course.tier_required),
  pass_threshold,
  questions: JSON.parse(JSON.stringify(questions)),
  is_published: publish,
  content_type: 'platform',
  author_id: null,
  lesson_id: null,        // course-level quiz
  course_id: courseId,
});
```

**Save payload (update):** Only `title`, `pass_threshold`, `questions`,
`is_published`.

After success → back to course detail.

---

## 7. Slide import dialog

A modal used by the lesson editor to bulk-create slides from a PDF or
images.

**Tabs:** `Upload PDF` | `Upload Images`.

**Limits:**

- PDF: `application/pdf`, max 20 MB.
- Images: PNG/JPG only, max 5 MB each, up to 50 at once.

**PDF flow** (client-side, no server):

1. `pdfjs-dist`: `getDocument({ data: arrayBuffer })`, iterate pages.
2. For each page, render to a `<canvas>` at `scale: 2`, then
   `canvas.toBlob(..., 'image/png')`.
3. Show extracted pages in a 3-column grid with checkboxes (all
   selected by default).

**Image flow:** Validate each file, then show the same grid.

**Import action (on confirm):**

For each selected page/image:

```ts
const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
const path = `${user.id}/${lessonFolderId}/slide-${Date.now()}-${i}.${ext}`;
await supabase.storage.from('lesson-assets').upload(path, blob, {
  contentType: blob.type, upsert: false,
});
const { data: pub } = supabase.storage.from('lesson-assets').getPublicUrl(path);
newSlides.push({
  id: crypto.randomUUID(),
  title: `Slide ${newSlides.length + 1}`,
  body: '',
  bullet_points: [],
  tip: '',
  image_url: pub.publicUrl,
  type: 'imported',
});
```

`lessonFolderId` is a stable UUID per lesson — for an existing lesson
use `lesson.id`, for a new lesson generate one in a `useRef` so all
uploads from the same editor session share a folder.

Caller appends `newSlides` to the slides array. On close, revoke any
created object URLs.

---

## 8. Quiz scoring (reference)

When a student submits a quiz attempt:

```ts
const totalQuestions = quiz.questions.length;
const correctCount = answers.filter(a => a.correct).length;
const score = Math.round((correctCount / totalQuestions) * 100);
const passed = score >= quiz.pass_threshold;

await supabase.from('quiz_attempts').insert({
  user_id, quiz_id, score, total_questions: totalQuestions,
  passed, answers, responses,
});
```

The Content Manager itself does not write attempts; this is only
included so the schema makes sense end-to-end.

---

## 9. Bootstrap checklist

Execute in this order:

1. **Create Supabase project.** Note URL + anon key.
2. **Auth.** Enable Email/password. Optionally enable Google OAuth.
   Do **not** auto-confirm emails unless explicitly desired.
3. **Run migration.** Concatenate every SQL block in §3 and §4 into a
   single migration and apply. Verify RLS is on all 5 tables.
4. **Storage.** Create the public `lesson-assets` bucket and apply the
   storage policies in §4.6.
5. **Promote yourself to admin.** After signing up once, run
   `update public.profiles set plan_state='admin', role='admin' where user_id='<your uuid>';`.
6. **Scaffold the React app.**
   - `npm create vite@latest -- --template react-ts`
   - Install: `@supabase/supabase-js`, `@tanstack/react-query`,
     `react-router-dom`, `sonner`, `tailwindcss`, shadcn/ui CLI,
     `pdfjs-dist`, `lucide-react`.
   - Add `pdfjs-dist` to `optimizeDeps.include` in `vite.config.ts` if
     you hit worker issues.
7. **Implement routes** in the order:
   1. Auth + admin guard
   2. `/admin/content` (Courses list, then Quizzes list)
   3. `/admin/content/course/new` and `/:courseId/edit`
   4. `/admin/content/course/:courseId` (detail; inline chapter
      edit/delete/reorder)
   5. `/admin/content/course/:courseId/chapter/new` (with placement
      preview + shift-down-on-insert)
   6. `/admin/content/lesson/new` and `/:lessonId` (incl. import dialog)
   7. `/admin/content/quiz/new` and `/:quizId`
8. **Seed (optional).** Create a Foundation course with 5 chapters
   (one per `f{1..5}_custom` module), add a couple of lessons, and a
   `module='foundation'` course quiz to verify the round trip.
9. **Smoke test.** As admin: create course → add chapter at position 2
   in an existing list → confirm shift-down → add lesson with imported
   PDF → publish → confirm `/admin/content` lessons count increments.

---

## 10. Out of scope

This spec deliberately does **not** cover:

- Student-facing learning UI (course catalog, lesson player, quiz
  runner, progress tracking, tier gating logic).
- Guru authoring UI (`content_type = 'guru'`, `class_enrollments`,
  `student_is_enrolled_in_class()` consumption). The schema/RLS leave
  the door open; the UI is a separate build.
- Payments, subscriptions, plan upgrades.
- Analytics dashboards.
- AI-assisted question or slide generation.
- Realtime / collaborative editing.
- Soft-delete or audit trail. Deletes are hard deletes; rely on
  database backups for recovery.

---

## 11. Glossary

| Term            | Meaning                                                         |
| --------------- | --------------------------------------------------------------- |
| **Tier**        | One of `foundation`/`tier1`/`tier2`/`tier3`; gates course access.|
| **Module**      | Legacy text taxonomy on lessons/quizzes; derived at save time.  |
| **Platform content** | Authored by admins, visible to all authenticated users.    |
| **Guru content**| Authored by gurus, visible only to enrolled students.           |
| **Display order** | 1-based sort key inside a parent (course / chapter).          |
| **Lesson #**    | `module_order` — 1-based sort key within a chapter.             |
| **Slide**       | A single screen of a lesson; text or imported image.            |
| **Pass threshold** | Percentage score (0–100) a student must reach to pass a quiz.|
