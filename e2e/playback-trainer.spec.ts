import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const PRO_AUTH_FILE = "e2e/.auth-playback-pro.json";
const STARTER_AUTH_FILE = "e2e/.auth-playback-starter.json";

let proStrategyId: string | null = null;

const PHASES = ["Context", "Setup", "Confirmation", "Entry", "Exit"] as const;
type Phase = (typeof PHASES)[number];

const hideDevOverlay = (page: Page) =>
  page.addStyleTag({
    content:
      ".bg-slate-900.border-slate-700.rounded-2xl.shadow-lg { display: none !important; }",
  });

const stepperButton = (page: Page, phase: Phase) =>
  page.getByRole("button", {
    name: new RegExp(`^\\d+\\.\\s*${phase}$`),
  });

const isPhaseActive = async (page: Page, phase: Phase) => {
  const cls = (await stepperButton(page, phase).first().getAttribute("class")) ?? "";
  return cls.includes("bg-primary");
};

const getActivePhase = async (page: Page): Promise<Phase | null> => {
  for (const phase of PHASES) {
    if (await isPhaseActive(page, phase)) return phase;
  }
  return null;
};

const goToPhase = async (page: Page, phase: Phase) => {
  await stepperButton(page, phase).first().click();
  await expect.poll(() => isPhaseActive(page, phase)).toBe(true);
};

const ensureMatchingStrategy = async (page: Page): Promise<string> => {
  await page.goto("/strategies");
  await page.waitForLoadState("networkidle");
  await hideDevOverlay(page);

  // Find an existing user strategy via the "My Strategies" section's View Details
  // (each user strategy card has it). If found, click to capture its ID.
  const myStrategiesHeader = page.getByRole("heading", {
    name: /My Strategies/i,
  });
  await myStrategiesHeader.waitFor({ state: "visible", timeout: 10000 });

  const watchDemoButton = page
    .getByRole("button", { name: /Watch Demo/i })
    .first();

  if ((await watchDemoButton.count()) > 0 && (await watchDemoButton.isEnabled())) {
    // Click View Details on the same card to capture the strategy ID
    const viewDetails = page
      .getByRole("button", { name: /View Details/i })
      .first();
    await viewDetails.click();
    await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 10000 });
    return page.url().split("/strategies/")[1];
  }

  // No existing strategy — create one with Long + EMA-9 + VWAP
  await page.goto("/strategies/new");
  await page
    .getByRole("button", { name: /Strategy Identity/i })
    .waitFor({ state: "visible", timeout: 15000 });
  await hideDevOverlay(page);

  await page.locator("input#name").fill("Playback Test Long EMA9 VWAP");

  const selects = page.getByRole("combobox");
  await selects.nth(0).click();
  await page.getByRole("option", { name: "Long", exact: true }).click();
  await selects.nth(1).click();
  await page.getByRole("option", { name: "MES", exact: true }).click();
  await selects.nth(2).click();
  await page.getByRole("option", { name: "5m", exact: true }).click();

  // Expand Indicators and enable EMA-9 + VWAP
  await page.getByRole("button", { name: /Indicators/i }).first().click();
  await page.getByRole("button", { name: /^EMA-9$/ }).first().click();
  await page.getByRole("button", { name: /^VWAP$/ }).first().click();

  await page.getByRole("button", { name: /^Save Strategy$/ }).click();
  await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 15000 });
  return page.url().split("/strategies/")[1];
};

const startPlayback = async (page: Page) => {
  await page.goto("/strategies");
  await page.waitForLoadState("networkidle");
  await hideDevOverlay(page);

  await page.getByRole("button", { name: /Watch Demo/i }).first().click();
  await page.waitForURL(/\/simulator\?.*playback=/, { timeout: 10000 });
  // Wait for stepper to render
  await stepperButton(page, "Context").first().waitFor({
    state: "visible",
    timeout: 10000,
  });
};

test.describe("Strategy Playback Trainer — Pro plan", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
    proStrategyId = await ensureMatchingStrategy(page);
    await ctx.storageState({ path: PRO_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: PRO_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("3.1 — Watch Demo button enabled on a strategy card", async ({ page }) => {
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const watchDemo = page.getByRole("button", { name: /Watch Demo/i }).first();
    await expect(watchDemo).toBeVisible();
    await expect(watchDemo).toBeEnabled();
  });

  test.skip(
    "3.2 — Watch Demo disabled when no scenario matches",
    async () => {
      // Match logic in useScenarioMatch.ts always falls back to scenarios[0].id
      // when any active scenario exists, and dirBonus = 1 whenever sc.direction === 'long'
      // (which both seed scenarios are). So matchedScenarioId is never null in practice
      // and the disabled state cannot be triggered with the current match logic.
      // Skipping per agreed plan; verify manually if the match logic changes.
    },
  );

  test("3.3 — Playback loads with Context active", async ({ page }) => {
    await startPlayback(page);
    expect(page.url()).toMatch(/playback=/);
    await expect(stepperButton(page, "Context").first()).toBeVisible();
    expect(await isPhaseActive(page, "Context")).toBe(true);
  });

  test("3.4 — Step-forward advances through all 5 phases", async ({ page }) => {
    await startPlayback(page);

    const seen = new Set<Phase>();
    const initial = await getActivePhase(page);
    if (initial) seen.add(initial);

    const stepFwd = page.getByTitle("Step forward");
    for (let i = 0; i < 200 && seen.size < PHASES.length; i++) {
      await stepFwd.click();
      const active = await getActivePhase(page);
      if (active) seen.add(active);
    }

    for (const phase of PHASES) {
      expect(seen.has(phase), `phase ${phase} should be reached`).toBe(true);
    }
  });

  test("3.5 — Setup phase shows annotations layer", async ({ page }) => {
    await startPlayback(page);
    await goToPhase(page, "Setup");

    const annotationLayer = page.locator(
      "div.absolute.inset-0.pointer-events-none.z-20",
    );
    // Annotation layer is mounted; the seed scenario may render 0 visible
    // annotations at Setup phase (only a tooltip), so assert layer attached only.
    await expect(annotationLayer.first()).toBeAttached();
  });

  test("3.6 — Confirmation phase shows an annotation box/zone", async ({
    page,
  }) => {
    await startPlayback(page);
    await goToPhase(page, "Confirmation");

    const annotationLayer = page.locator(
      "div.absolute.inset-0.pointer-events-none.z-20",
    );
    await expect(annotationLayer.first()).toBeAttached();
    await expect.poll(
      async () => await annotationLayer.first().locator("> div").count(),
      { timeout: 5000 },
    ).toBeGreaterThan(0);
  });

  test("3.7 — Entry phase shows entry/stop/target labels", async ({ page }) => {
    await startPlayback(page);
    await goToPhase(page, "Entry");

    await expect(page.getByText(/entry|stop|target/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("3.8 — Demo Complete card with result, Try It Yourself, Replay", async ({
    page,
  }) => {
    await startPlayback(page);
    await goToPhase(page, "Exit");

    // Step forward repeatedly to advance past Exit → Complete
    const stepFwd = page.getByTitle("Step forward");
    for (let i = 0; i < 100; i++) {
      const heading = page.getByRole("heading", { name: /Demo Complete/i });
      if (await heading.isVisible().catch(() => false)) break;
      await stepFwd.click();
    }

    const completeCard = page
      .getByRole("heading", { name: /Demo Complete/i })
      .locator("xpath=..");
    await expect(completeCard).toBeVisible();
    await expect(completeCard.getByText(/\+\d+\s*pts/i)).toBeVisible();
    await expect(
      completeCard.getByRole("button", { name: /Try It Yourself/i }),
    ).toBeVisible();
    await expect(
      completeCard.getByRole("button", { name: /^Replay$/i }),
    ).toBeVisible();
  });

  test("3.9 — Annotations container persists after a brief delay", async ({
    page,
  }) => {
    await startPlayback(page);
    await goToPhase(page, "Entry");

    const annotationLayer = page.locator(
      "div.absolute.inset-0.pointer-events-none.z-20",
    );
    await expect(annotationLayer.first()).toBeAttached();

    // Loose check per agreed plan: no canvas interaction (chart hover/wheel
    // can fire chart-internal handlers that exit playback). Just wait briefly.
    await page.waitForTimeout(500);
    await expect(annotationLayer.first()).toBeAttached();
  });

  test("3.10 — Play auto-advances; Pause halts", async ({ page }) => {
    await startPlayback(page);
    expect(await getActivePhase(page)).toBe("Context");

    // Speed up to 2× so the test isn't slow; baseTickMs=220 → 110ms at 2×
    await page.getByRole("button", { name: /^2×$/ }).click();
    await page.getByTitle("Play").click();
    await page.waitForTimeout(2500);
    // After 2.5s at 2×, we should have moved past Context. Click pause if still playing.
    const pause = page.getByTitle("Pause");
    if (await pause.isVisible().catch(() => false)) {
      await pause.click();
    }

    const finalPhase = await getActivePhase(page);
    expect(finalPhase).not.toBe("Context");
  });

  test("3.11 — Speed buttons 0.5×, 1×, 2× visible", async ({ page }) => {
    await startPlayback(page);
    await expect(page.getByRole("button", { name: /^0\.5×$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^1×$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^2×$/ })).toBeVisible();
  });

  test("3.12 — Replay resets to Context", async ({ page }) => {
    await startPlayback(page);
    await goToPhase(page, "Exit");

    const stepFwd = page.getByTitle("Step forward");
    for (let i = 0; i < 100; i++) {
      const heading = page.getByRole("heading", { name: /Demo Complete/i });
      if (await heading.isVisible().catch(() => false)) break;
      await stepFwd.click();
    }

    const completeCard = page
      .getByRole("heading", { name: /Demo Complete/i })
      .locator("xpath=..");
    await completeCard.getByRole("button", { name: /^Replay$/i }).click();
    await expect.poll(() => isPhaseActive(page, "Context"), {
      timeout: 5000,
    }).toBe(true);
  });

  test("3.13 — Try It Yourself enters practice mode", async ({ page }) => {
    await startPlayback(page);
    await goToPhase(page, "Exit");

    const stepFwd = page.getByTitle("Step forward");
    for (let i = 0; i < 100; i++) {
      const heading = page.getByRole("heading", { name: /Demo Complete/i });
      if (await heading.isVisible().catch(() => false)) break;
      await stepFwd.click();
    }

    await page.getByRole("button", { name: /Try It Yourself/i }).click();
    await page.waitForURL(/practice=1/, { timeout: 5000 });
    await expect(page.getByText(/practice mode/i).first()).toBeVisible();
  });

  test("3.14 — Practice mode exposes Buy and Sell trade controls", async ({
    page,
  }) => {
    expect(proStrategyId).toBeTruthy();
    // Need scenario ID — start playback once to grab it from URL
    await startPlayback(page);
    const url = new URL(page.url());
    const playbackParam = url.searchParams.get("playback");
    expect(playbackParam).toBeTruthy();

    await page.goto(`/simulator?playback=${playbackParam}&practice=1`);
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    await expect(page.getByText(/practice mode/i).first()).toBeVisible();

    // Topbar has the primary "Trade" button; BottomBar has a duplicate. Pick first.
    await page.getByRole("button", { name: /^Trade$/ }).first().click();
    // TradeOrderPanel renders a Sell/Buy toggle bar with both labels
    await expect(page.getByText(/^Sell$/).first()).toBeVisible();
    await expect(page.getByText(/^Buy$/).first()).toBeVisible();
  });
});

test.describe("Strategy Playback Trainer — Starter (locked)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(
      page,
      TEST_ACCOUNTS.starter.email,
      TEST_ACCOUNTS.starter.password,
    );
    // Ensure starter has at least one user strategy with Watch Demo
    await ensureMatchingStrategy(page).catch(() => {
      /* if cap reached, fall back to whatever exists */
    });
    await ctx.storageState({ path: STARTER_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: STARTER_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("3.15 — Starter sees upgrade overlay when advancing past Context", async ({
    page,
  }) => {
    await startPlayback(page);
    expect(await isPhaseActive(page, "Context")).toBe(true);

    // Advancing past Context — click Step forward repeatedly OR jump via stepper.
    // Stepper buttons past Context are disabled for starter, so use Step forward.
    const stepFwd = page.getByTitle("Step forward");
    for (let i = 0; i < 200; i++) {
      await stepFwd.click();
      const upgradeText = page.getByText(/watch the full.*on pro/i);
      if (await upgradeText.isVisible().catch(() => false)) break;
    }

    await expect(
      page.getByText(
        /watch the full.*on pro|starter shows the context phase only/i,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Back to Context/i }),
    ).toBeVisible();

    // Demo Complete should NOT be reachable
    await expect(
      page.getByRole("heading", { name: /Demo Complete/i }),
    ).toHaveCount(0);
  });
});
