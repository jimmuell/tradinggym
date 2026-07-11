import { test, expect, type Page, type Locator } from "@playwright/test";
import { authedClient } from "./helpers/supabase";

// Foundation graduation — POSITIVE half, from ZERO (the coverage the Jul-7 fix was missing).
//
// Complement to e2e/foundation-gate.spec.ts, which covers the NEGATIVE half (the gate REJECTS the
// unqualified: un-graduated stays locked, planted localStorage is purged, direct tier_state / RPC
// escalation is refused). This one covers the POSITIVE half (the gate ADMITS the qualified): a
// brand-new signup completes every Foundation module, passes the server-graded assessment, and
// graduates — surviving a hard reload. Together they are complements; the positive half is the one
// that never existed, which is why the "count read from localStorage, written to lesson_progress"
// bug (live Jul 7–11) went uncaught for five days: every account we tested with was ALREADY
// graduated, so none of them exercised the fresh-user count path.
//
// WHY THIS HAS TEETH (fails if the count is read from anything but the database):
//  - The account is created fresh in this test, so localStorage['completedLessons'] is empty
//    throughout (asserted null via page.evaluate). The pre-fix code computed the module count from
//    that key, so on the old bundle this spec renders "0 of N", leaves "Take Assessment" disabled,
//    and FAILS at the count/enabled assertions. It can only go green when the count is read from
//    the server lesson_progress rows.
//  - Empirical control (runs every time): BEFORE completing any lesson we assert "0 of N modules
//    complete" + Take Assessment DISABLED; AFTER completing we assert "N of N" + ENABLED. That 0→N
//    transition is driven purely by lesson_progress writes (localStorage stays empty), so a
//    hardcoded or localStorage-sourced count cannot produce it.
//  - We then delete ONLY the completedLessons* keys (never localStorage.clear() — that would drop
//    the Supabase auth token and log out) and hard-reload; "N of N" must still render, which is
//    only possible if it comes from the DB. We independently confirm N lesson_progress rows via an
//    authed supabase-js client.
//
// Runs against the Published host (playwright.config baseURL). No SQL writes; tier_state /
// plan_state / lesson_progress are never touched directly — every state change goes through the UI
// and the server RPCs (submit_quiz_attempt, graduate_foundation, update_own_profile).

const PASSWORD = "TgymQA2026!";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

// Click the option button whose answer text exactly equals `correct` (after stripping the A/B/C/D
// letter badge). Exact match, so a correct answer that is a substring of a distractor (e.g. "$200"
// inside "$2000") can't select the wrong button.
async function answerCorrect(page: Page, correct: string) {
  const optionButtons: Locator = page.locator("button", {
    has: page.locator("span").filter({ hasText: /^[A-D]$/ }),
  });
  const count = await optionButtons.count();
  for (let j = 0; j < count; j++) {
    const btn = optionButtons.nth(j);
    const txt = (await btn.innerText()).replace(/^[A-D]\s*/, "").trim();
    if (txt === correct.trim()) {
      await btn.click();
      return;
    }
  }
  throw new Error(`No quiz option matched correct answer: "${correct}"`);
}

async function signUpFresh(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: /sign up/i }).click();
  const panel = page.getByRole("tabpanel");
  await panel.getByPlaceholder("you@example.com").fill(email);
  const pw = panel.getByPlaceholder("••••••••");
  await pw.nth(0).fill(password); // password
  await pw.nth(1).fill(password); // confirm
  const boxes = panel.locator('input[type="checkbox"]'); // ToS + age
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await panel.getByRole("button", { name: /^sign up$/i }).click();
  // Auto-confirm is on for this project (the +qalrn accounts are loginable straight after signup),
  // so signUp returns a session and onAuthStateChange authenticates this browser context.
  await expect(page.getByText(/Account created successfully/i)).toBeVisible({ timeout: 30_000 });
}

test.describe("Foundation graduation — fresh signup → 5 modules → assessment → graduate (positive half)", () => {
  test.describe.configure({ timeout: 300_000 });

  test("a brand-new user can complete Foundation and graduate, and it survives a hard reload", async ({
    page,
  }) => {
    const email = `jamesloganmueller+qalrn${Date.now()}@gmail.com`;
    console.log(`[foundation-graduation-fresh] created account: ${email}`);

    // ── 1) Fresh signup ────────────────────────────────────────────────────────────────────────
    await signUpFresh(page, email, PASSWORD);

    // Server truth via the SAME client the app uses (RLS/RPC behave as in prod).
    const { sb } = await authedClient(email, PASSWORD);

    // The real Foundation lesson set (identical query to Foundation.tsx' useFoundationLessons).
    const { data: lessonRows } = await sb
      .from("lessons")
      .select("id")
      .eq("content_type", "platform")
      .eq("tier_required", "foundation")
      .eq("is_published", true)
      .like("module", "f%")
      .order("module_order", { ascending: true });
    const lessonIds = (lessonRows ?? []).map((r: { id: string }) => r.id);
    const N = lessonIds.length;
    expect(N, "expected a non-empty Foundation lesson set").toBeGreaterThan(0);

    // The server-authoritative assessment (identical query to useQuizByModule('foundation')).
    const { data: quizRow } = await sb
      .from("quizzes")
      .select("*")
      .eq("module", "foundation")
      .eq("content_type", "platform")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(quizRow, "Foundation assessment quiz must exist").toBeTruthy();
    const questions = (quizRow as { questions: QuizQuestion[] }).questions;
    const expectedQuestionCount = questions.length; // read from truth — never hardcoded (currently 10)
    expect(expectedQuestionCount, "assessment must have questions").toBeGreaterThan(0);

    // Shadow guard (defence-in-depth behind the DB uniqueness index
    // `quizzes_one_published_platform_per_module`): there must be EXACTLY ONE published platform
    // foundation quiz. A May-9→Jul-11 regression served a 1-question stub as the gate because three
    // published quizzes existed and useQuizByModule() takes created_at DESC LIMIT 1. If a duplicate
    // is ever published again, this assertion — and the "of N" UI check below — go red.
    const { data: publishedQuizzes } = await sb
      .from("quizzes")
      .select("id")
      .eq("module", "foundation")
      .eq("content_type", "platform")
      .eq("is_published", true);
    expect(
      (publishedQuizzes ?? []).length,
      "exactly one published platform foundation quiz may gate graduation",
    ).toBe(1);

    // Fresh account starts un-graduated with zero progress (server truth).
    const { data: prof0 } = await sb.from("profiles").select("tier_state").maybeSingle();
    expect((prof0 as { tier_state?: string } | null)?.tier_state).toBe("foundation");
    const { data: lp0 } = await sb.from("lesson_progress").select("lesson_id");
    expect((lp0 ?? []).length, "fresh account has no lesson_progress rows").toBe(0);

    // ── 2) PRECONDITION / bundle proof: the fixed page READS the DB on load ──────────────────────
    // The fixed Foundation page issues GET /rest/v1/lesson_progress?select=lesson_id... on mount
    // (useCompletedLessonIds). The pre-fix bundle read localStorage and never made this request, so
    // this waitForRequest is a clean "the new bundle is live" gate: if it times out, STOP — we are
    // on the old build and any pass/fail below would be about the wrong runtime.
    const progressGet = page.waitForRequest(
      (req) =>
        req.method() === "GET" &&
        /\/rest\/v1\/lesson_progress\?.*select=lesson_id/.test(req.url()),
      { timeout: 25_000 },
    );
    await page.goto("/learning/foundation");
    await progressGet; // proves the DB-reading (fixed) bundle is deployed

    // ── 3) Control (teeth): before completing anything, count is 0 and the gate is CLOSED ────────
    const lsCompletions = () =>
      page.evaluate(() => localStorage.getItem("completedLessons"));
    expect(await lsCompletions(), "fresh account never wrote completedLessons").toBeNull();
    await expect(page.getByText(new RegExp(`0 of ${N} modules complete`, "i"))).toBeVisible();
    await expect(page.getByRole("button", { name: /take assessment/i })).toBeDisabled();

    // ── 4) Complete all N modules through the UI (writes lesson_progress on the server) ──────────
    for (const id of lessonIds) {
      await page.goto(`/learning/foundation/${id}`);
      const completeBtn = page.getByRole("button", { name: /complete lesson/i });
      for (let guard = 0; guard < 40 && !(await completeBtn.isVisible()); guard++) {
        await page.getByRole("button", { name: /^next$/i }).click();
      }
      await expect(completeBtn).toBeVisible();
      await completeBtn.click();
      await page.waitForURL(/\/learning\/foundation$/, { timeout: 30_000 });
    }

    // Server confirms N completions; localStorage still empty (proves writes went to the DB).
    const { data: lpN } = await sb.from("lesson_progress").select("lesson_id");
    expect((lpN ?? []).length, "all modules recorded in lesson_progress").toBe(N);
    expect(await lsCompletions(), "completion never written to localStorage").toBeNull();

    // ── 5) Hard reload with completedLessons* removed → count must come from the DB (TEETH) ──────
    // Delete ONLY the completion keys, never the whole store (that holds the Supabase auth token).
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("completedLessons"))
        .forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
    await expect(page.getByText(new RegExp(`${N} of ${N} modules complete`, "i"))).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /take assessment/i })).toBeEnabled();

    // ── 6) Take the assessment and pass it legitimately (server-graded via submit_quiz_attempt) ──
    await page.getByRole("button", { name: /take assessment/i }).click();
    await page.waitForURL(/\/learning\/foundation\/quiz$/, { timeout: 30_000 });

    // The RUNNING app must serve exactly as many questions as the single published quiz row (the
    // QuizRunner header reads "Question 1 of {total}"). Read from truth, asserted against the UI —
    // so a 1-question stub leaking through the app (as happened for two months) makes this red.
    await expect(page.getByText(`Question 1 of ${expectedQuestionCount}`)).toBeVisible({
      timeout: 30_000,
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await expect(page.getByText(q.question).first()).toBeVisible();
      await answerCorrect(page, q.options[q.correct_index]);
      const last = i === questions.length - 1;
      await page.getByRole("button", { name: last ? /finish quiz/i : /next question/i }).click();
    }

    // Server verdict (not a client boast): the PASSED badge + full score come from the RPC result.
    await expect(page.getByText("PASSED")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(new RegExp(`${questions.length}\\s*/\\s*${questions.length} correct`)),
    ).toBeVisible();

    // ── 7) Acknowledge risk → graduate_foundation fires ─────────────────────────────────────────
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(/Foundation Complete/i)).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole("checkbox").click();
    await dialog.getByRole("button", { name: /Unlock Trading Simulator/i }).click();
    await expect(page.getByText(/Welcome to Price Action|Simulator is now unlocked/i)).toBeVisible({
      timeout: 30_000,
    });

    // ── 8) Graduation is real: server tier_state = tier1, and the gated features open ────────────
    const { data: profTier1 } = await sb.from("profiles").select("tier_state").maybeSingle();
    expect((profTier1 as { tier_state?: string } | null)?.tier_state).toBe("tier1");

    await assertUnlocked(page);

    // ── 9) Hard reload → graduation persists (proves DB, not in-memory React state) ──────────────
    await page.goto("/learning/foundation");
    await page.reload();
    await expect(page.getByText(new RegExp(`${N} of ${N} modules complete`, "i"))).toBeVisible({
      timeout: 30_000,
    });
    const { data: profReload } = await sb.from("profiles").select("tier_state").maybeSingle();
    expect((profReload as { tier_state?: string } | null)?.tier_state).toBe("tier1");
    await assertUnlocked(page);
  });
});

// Simulator / Strategies / Analytics unlocked + Tier 1 lessons open. Locked screens render
// "<Feature> Locked" / "Simulator Locked"; Tier 1 gated renders "Complete Foundation to unlock".
async function assertUnlocked(page: Page) {
  await page.goto("/simulator");
  await expect(page.getByText(/Simulator Locked/i)).toHaveCount(0);
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });

  await page.goto("/strategies");
  await expect(page.getByText(/Strategies Locked/i)).toHaveCount(0);
  await expect(page.getByText(/Browse proven trading strategies/i)).toBeVisible({ timeout: 30_000 });

  await page.goto("/analytics");
  await expect(page.getByText(/Analytics Locked/i)).toHaveCount(0);

  await page.goto("/learning/tier1");
  await expect(page.getByText(/Complete Foundation to unlock/i)).toHaveCount(0);
}
