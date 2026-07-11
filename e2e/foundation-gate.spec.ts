import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { authedClient } from "./helpers/supabase";

// Regression guard proving the Foundation graduation gate is SERVER-AUTHORITATIVE and cannot be
// bypassed from the client. Runs against the Published host (playwright.config baseURL). The
// authoritative checks are the server rows/RPC (profiles.tier_state, RLS, graduate_foundation),
// queried with an authed supabase-js client; the DOM only reflects them.
//
// NOTE: the "chart renders" check in D8 is DOM-PRESENCE (a <canvas> is mounted), not visual
// correctness — canvas pixels are out of scope here.

const S_FRESH = { email: "starter@gmail.com", password: process.env.TEST_PASSWORD ?? "" };
// A stable Foundation-graduated (tier_state='tier1') seed for the positive path. Was
// jamesloganmueller+sgrad@gmail.com, but that credential is now rejected — a direct
// signInWithPassword with its documented password returns "Invalid login credentials" (observed
// 2026-07-11; cause not confirmed). pro@gmail.com is a stable seed at tier1 (verified: login OK,
// tier_state='tier1') and the same graduated account lane-b-batch2 uses, so test D no longer
// depends on a rotated disposable credential.
const S_GRAD = { email: "pro@gmail.com", password: process.env.TEST_PASSWORD ?? "" };

// The /simulator gate screen for an un-graduated user ("Simulator Locked" + "Complete all N
// Foundation modules and pass the assessment"). Distinct from the chart.
const LOCK_RE = /Simulator Locked/i;

async function tierState(sb: Awaited<ReturnType<typeof authedClient>>["sb"]): Promise<string | null> {
  const { data } = await sb.from("profiles").select("tier_state").maybeSingle();
  return (data as { tier_state?: string } | null)?.tier_state ?? null;
}

// The live Foundation lesson set — read from the DB (identical query to Foundation.tsx'
// useFoundationLessons), never hardcoded. Content changes (7 → 5 lessons happened once already)
// must not turn this guard red; the count comes from truth, so the spec tracks it.
async function foundationLessonIds(
  sb: Awaited<ReturnType<typeof authedClient>>["sb"],
): Promise<string[]> {
  const { data } = await sb
    .from("lessons")
    .select("id")
    .eq("content_type", "platform")
    .eq("tier_required", "foundation")
    .eq("is_published", true)
    .like("module", "f%");
  return (data ?? []).map((l: { id: string }) => l.id);
}

async function simulatorLocked(page: Page) {
  await page.goto("/simulator");
  await expect(page.getByText(LOCK_RE)).toBeVisible(); // the FoundationEmptyState lock, not the chart
  await expect(page.locator("canvas")).toHaveCount(0);
}

test.describe("Foundation gate — server-authoritative, no client bypass", () => {
  test.describe.configure({ timeout: 90_000 });

  // A — fresh / un-graduated (S-fresh)
  test("A: un-graduated shows 0 of N, Simulator locked, server tier_state is foundation", async ({
    page,
  }) => {
    // A3 — server truth
    const { sb } = await authedClient(S_FRESH.email, S_FRESH.password);
    expect(await tierState(sb)).toBe("foundation");
    const n = (await foundationLessonIds(sb)).length; // N from truth, not a memorised 7
    expect(n, "expected a non-empty Foundation lesson set").toBeGreaterThan(0);

    // A1 — Foundation progress
    await login(page, S_FRESH.email, S_FRESH.password);
    await page.goto("/learning/foundation");
    await expect(page.getByText(new RegExp(`0 of ${n} modules complete`, "i"))).toBeVisible();
    await expect(page.getByText(/Not started/i).first()).toBeVisible();

    // A2 — Simulator gate
    await simulatorLocked(page);
  });

  // B — client cannot drive completion (the localStorage leak)
  test("B: planted completedLessons* does not unlock and is purged on reload", async ({ page }) => {
    const { sb, uid } = await authedClient(S_FRESH.email, S_FRESH.password);
    const ids = await foundationLessonIds(sb);
    expect(ids.length, "expected a non-empty Foundation lesson set").toBeGreaterThan(0);

    await login(page, S_FRESH.email, S_FRESH.password);
    await page.goto("/learning/foundation");
    // B4 — plant both key shapes the app reads
    await page.evaluate(
      ([uidArg, idsArg]) => {
        localStorage.setItem("completedLessons", JSON.stringify(idsArg));
        localStorage.setItem(`completedLessons:${uidArg}`, JSON.stringify(idsArg));
      },
      [uid, ids] as const,
    );
    await page.reload();

    // still gated
    await expect(page.getByText(new RegExp(`0 of ${ids.length} modules complete`, "i"))).toBeVisible();
    await simulatorLocked(page);

    // B5 — the planted keys are purged (auth-change purge)
    await page.goto("/learning/foundation");
    await expect
      .poll(() =>
        page.evaluate(
          (uidArg) => [
            localStorage.getItem("completedLessons"),
            localStorage.getItem(`completedLessons:${uidArg}`),
          ],
          uid,
        ),
      )
      .toEqual([null, null]);
  });

  // C — client cannot force the gate (privilege escalation)
  test("C: direct tier_state update is RLS-rejected and graduate_foundation refuses", async ({
    page,
  }) => {
    const { sb, uid } = await authedClient(S_FRESH.email, S_FRESH.password);

    // C6 — direct escalation attempt
    const { error: updErr } = await sb
      .from("profiles")
      .update({ tier_state: "tier1" })
      .eq("user_id", uid);
    // rejected (error) OR silently no-op — either way the invariant is tier_state unchanged
    expect(await tierState(sb), `update err: ${updErr?.message ?? "none"}`).toBe("foundation");

    // C7 — RPC with prerequisites unmet
    const { data: rpc } = await sb.rpc("graduate_foundation");
    const res = rpc as { success?: boolean; error?: string };
    expect(res?.success).toBe(false);
    expect(res?.error ?? "").toMatch(/Foundation assessment not passed|Complete all Foundation lessons/i);
    expect(await tierState(sb)).toBe("foundation");

    // and the UI stays locked
    await login(page, S_FRESH.email, S_FRESH.password);
    await simulatorLocked(page);
  });

  // D — positive path still works (S-grad)
  test("D: graduated user is tier1 server-side and the Simulator opens", async ({ page }) => {
    const { sb } = await authedClient(S_GRAD.email, S_GRAD.password);
    expect(await tierState(sb)).toBe("tier1");

    await login(page, S_GRAD.email, S_GRAD.password);
    await page.goto("/simulator");
    await expect(page.locator("canvas").first()).toBeVisible(); // chart mounted (DOM-presence, not pixels)
    await expect(page.getByText(LOCK_RE)).toHaveCount(0);
  });
});
