import { test, expect, type Page } from "@playwright/test";
import { stubGuidedScenario } from "./helpers/scenario";

// Regression guard for the guided ORB walkthrough BEAT LOGIC — DOM checkpoints only, so a future
// change that breaks the step-by-step reveal (e.g. the old "2/3/4 steps check at once" collapse, or
// step 6 checking before the trade resolves) fails the suite. Auth reuses the setup project's
// session (e2e/.auth.json); the scenario is served from SAVED REPLAY DATA (real row db83bd35) so it
// doesn't depend on the live DB row.
//
// OUT OF SCOPE (by design): the canvas/chart visuals — pre-Start single-candle / no-EMA, ORB line
// positions, per-beat candle reveal — are NOT DOM-observable (lightweight-charts renders to canvas),
// and are exactly the class of bug DOM assertions miss (see the pre-Start spoiler race, PR #22).
// Those must be verified by screenshot across reloads; we do NOT assert on pixels here.

test.use({ storageState: "e2e/.auth.json" });

const SCENARIO_ID = "db83bd35-4bdf-4dc4-a93b-4894e33ee537";
const LABELS = [
  "Mark Opening Range",
  "Wait for Breakout",
  "Wait for Retest",
  "Confirm the Retest",
  "Set Targets",
  "Execute & Review",
];

// In guided mode the six step checkboxes are the only checkboxes (the "Show me" toggle is hidden
// when mode==='guided'); shadcn Checkbox renders role="checkbox" with data-state checked/unchecked.
function checkedCount(page: Page): Promise<number> {
  return page.locator('[role="checkbox"][data-state="checked"]').count();
}

test.describe("Guided ORB walkthrough — DOM regression guard", () => {
  test.beforeEach(async ({ page }) => {
    await stubGuidedScenario(page);
    await page.goto(`/simulator?playback=${SCENARIO_ID}`);
    await expect(page.getByText("ORB Blueprint")).toBeVisible(); // guided checklist mounted
  });

  // 1 — Pre-Start
  test("pre-Start: six labels shown, all steps unchecked, Start visible", async ({ page }) => {
    for (const label of LABELS) await expect(page.getByText(label).first()).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(6);
    expect(await checkedCount(page)).toBe(0);
    await expect(page.getByRole("button", { name: /start walkthrough/i })).toBeVisible();
  });

  // 2, 3, 4 — one-at-a-time auto-check; step 6 gated on the outcome
  test("beats check exactly one step at a time; step 6 only after the trade resolves", async ({
    page,
  }) => {
    // 2 — Start → exactly step 1
    await page.getByRole("button", { name: /start walkthrough/i }).click();
    await expect.poll(() => checkedCount(page)).toBe(1);

    // 3 — advance beats 2..5 via the top stepper; each adds exactly ONE check
    for (let beat = 2; beat <= 5; beat++) {
      await page.getByRole("button", { name: new RegExp(`^${beat}\\.`) }).click();
      await expect.poll(() => checkedCount(page)).toBe(beat);
    }

    // 4a — entering beat 6 must NOT check step 6 (count stays 5 until the outcome resolves)
    await page.getByRole("button", { name: /^6\./ }).click();
    await expect(page.getByRole("button", { name: /next candle/i })).toBeVisible();
    await expect.poll(() => checkedCount(page)).toBe(5);

    // 4b — reveal candles until the trade resolves (fixture wins at bar 11)
    for (let i = 0; i < 6; i++) {
      const nc = page.getByRole("button", { name: /next candle/i });
      if (!(await nc.isVisible().catch(() => false))) break;
      await nc.click();
    }

    // 4c — outcome resolved: banner, step 6 now checked, Blueprint Complete + end CTAs
    await expect(page.getByText(/Target hit \+5\.25 pts/i)).toBeVisible();
    await expect.poll(() => checkedCount(page)).toBe(6);
    await expect(page.getByText(/Blueprint Complete/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /try it yourself/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^replay/i }).first()).toBeVisible();
  });
});
