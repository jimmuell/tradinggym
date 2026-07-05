import { test, expect } from "@playwright/test";

/**
 * Landing page — every button & link works (logged out).
 *
 * Maps 1:1 to the Notion "Pre-Launch Test Plan" Landing Page cases LP-01..LP-06.
 * Complements landing.spec.ts (which covers content rendering); this file is the
 * navigation / click-through matrix. All tests run as an anonymous visitor — no
 * stored auth session — because that is the real landing-page audience.
 *
 * Element inventory (verified live on keen-chart-clone.lovable.app, Jul 5 2026):
 *   Header:  Features -> #features | How It Works -> #how-it-works | Pricing -> #pricing
 *            logo -> #top | Log In -> /auth | Start Free -> /auth
 *   Hero:    Start Free -> /auth | See How It Works -> #how-it-works
 *   Pricing: Starter/Free -> /auth | Pro -> /auth?plan=pro
 *            Expert -> /auth?plan=expert | Guru -> /auth?plan=guru
 *   Guru band: Start Teaching -> /auth
 *   Footer:  Terms of Service -> /terms | Privacy Policy -> /privacy
 */

test.describe("Landing page — links & navigation (logged out)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  // LP-01 — Header nav anchor links -----------------------------------------
  test.describe("LP-01 · header nav anchors", () => {
    const anchors: [string, string][] = [
      ["Features", "#features"],
      ["How It Works", "#how-it-works"],
      ["Pricing", "#pricing"],
    ];

    for (const [label, hash] of anchors) {
      test(`LP-01 · "${label}" scrolls to ${hash}`, async ({ page }) => {
        const link = page.locator(`nav a[href="${hash}"]`).first();
        await expect(link).toBeVisible();
        await link.click();
        // Robust to smooth-scroll vs. hash routing: assert the target section
        // is actually brought into the viewport.
        await expect(page.locator(hash)).toBeInViewport({ timeout: 5000 });
      });
    }

    test('LP-01 · logo returns to top', async ({ page }) => {
      // Scroll away first so "back to top" is a meaningful movement.
      await page.locator('nav a[href="#pricing"]').first().click();
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

      await page.locator('nav a[href="#top"]').first().click();
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.scrollY)).toBeLessThan(100);
    });
  });

  // LP-02 — Header auth CTAs --------------------------------------------------
  test.describe("LP-02 · header auth CTAs", () => {
    test('LP-02 · "Log In" navigates to /auth', async ({ page }) => {
      await page.locator("nav").getByRole("link", { name: /log in/i }).first().click();
      await page.waitForURL(/\/auth(\?|$)/);
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test('LP-02 · header "Start Free" navigates to /auth', async ({ page }) => {
      await page.locator("nav").getByRole("link", { name: /start free/i }).first().click();
      await page.waitForURL(/\/auth(\?|$)/);
      await expect(
        page.getByRole("tab", { name: /log in|sign up/i }).first(),
      ).toBeVisible();
    });
  });

  // LP-03 — Hero CTAs --------------------------------------------------------
  test.describe("LP-03 · hero CTAs", () => {
    test('LP-03 · hero "Start Free" navigates to /auth and renders', async ({ page }) => {
      // Hero Start Free is the second Start Free link in DOM order (after header).
      await page.getByRole("link", { name: /start free/i }).nth(1).click();
      await page.waitForURL(/\/auth(\?|$)/);
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test('LP-03 · "See How It Works" scrolls to #how-it-works (no navigation)', async ({ page }) => {
      await page.getByRole("link", { name: /see how it works/i }).first().click();
      await expect(page).toHaveURL(/\/($|#)/); // stayed on landing
      await expect(page.locator("#how-it-works")).toBeInViewport({ timeout: 5000 });
    });
  });

  // LP-04 — Pricing plan CTAs + plan intent ---------------------------------
  test.describe("LP-04 · pricing plan CTAs", () => {
    // [locator-href, expected-url-regex]. Starter/Free CTA is the only /auth
    // link inside #pricing with no query param.
    const plans: [string, RegExp][] = [
      ['#pricing a[href="/auth"]', /\/auth(\?|$)/],
      ['#pricing a[href="/auth?plan=pro"]', /\/auth\?plan=pro$/],
      ['#pricing a[href="/auth?plan=expert"]', /\/auth\?plan=expert$/],
      ['#pricing a[href="/auth?plan=guru"]', /\/auth\?plan=guru$/],
    ];

    for (const [selector, urlRe] of plans) {
      test(`LP-04 · ${selector} routes to ${urlRe.source}`, async ({ page }) => {
        await page.locator("#pricing").scrollIntoViewIfNeeded();
        const cta = page.locator(selector).first();
        await expect(cta).toBeVisible();
        await cta.click();
        await page.waitForURL(urlRe);
        expect(page.url()).toMatch(urlRe);
        // Auth page must render (not a blank/errored route).
        await expect(page.getByText(/welcome back/i)).toBeVisible();
      });
    }

    // KNOWN GAP (spot-checked Jul 5 2026): when logged out, /auth?plan=<x> keeps
    // the param in the URL but the auth page shows the plain Log In tab with no
    // visible plan reflection. Whether the plan is actually applied after a
    // logged-out signup is UNVERIFIED. Un-skip and implement once the intended
    // behavior is confirmed (e.g. Sign Up tab preselected, or plan attributed
    // to the new account / carried to Stripe checkout).
    test.fixme(
      "LP-04 · plan intent is applied after a logged-out signup",
      async ({ page }) => {
        await page.goto("/auth?plan=pro");
        await expect(page.getByText(/you selected the pro plan/i)).toBeVisible();
      },
    );
  });

  // LP-05 — Guru "Start Teaching" CTA ---------------------------------------
  test("LP-05 · \"Start Teaching\" navigates to /auth", async ({ page }) => {
    await page.getByRole("link", { name: /start teaching/i }).first().click();
    await page.waitForURL(/\/auth(\?|$)/);
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  // LP-06 — Footer legal links ----------------------------------------------
  test.describe("LP-06 · footer legal links", () => {
    test('LP-06 · "Terms of Service" opens /terms and renders', async ({ page }) => {
      await page.getByRole("link", { name: /terms of service/i }).first().click();
      await page.waitForURL(/\/terms$/);
      await expect(
        page.getByRole("heading", { name: /terms of service/i }),
      ).toBeVisible();
    });

    test('LP-06 · "Privacy Policy" opens /privacy and renders', async ({ page }) => {
      await page.getByRole("link", { name: /privacy policy/i }).first().click();
      await page.waitForURL(/\/privacy$/);
      await expect(
        page.getByRole("heading", { name: /privacy policy/i }),
      ).toBeVisible();
    });
  });
});
