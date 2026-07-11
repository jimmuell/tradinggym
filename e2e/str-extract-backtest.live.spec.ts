import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

// STR-03 — AI Extract → strategy → backtest (Pro, Foundation-graduated). ON-DEMAND LIVE tier: this
// is METERED (one Claude AI-extraction + one real backtest) so it is EXCLUDED from the default
// quota-free suite (chromium project ignores *.live.spec.ts; the `live` project only registers when
// RUN_LIVE_BACKTESTS=true). Run once, manually:  npm run test:e2e:live
//
// STATUS: authored this session but NOT executed here (metered). Needs one manual verification run
// to confirm the selectors against the live AI-extract UI; treat a green here as observed only after
// that run. Uses pro@gmail.com, which is currently tier_state 'tier1' (Foundation-graduated) so
// Simulator/Strategies/AI-Extract are unlocked and the Pro monthly backtest cap applies.

const PRO = { email: "pro@gmail.com", password: process.env.TEST_PASSWORD ?? "" };

// A short, unambiguous price-action transcript so the extractor has real rules to structure.
const TRANSCRIPT = `Opening range breakout on MES, five minute chart. Mark the high and low of the
first five minute candle after the 9:30 open. Go long when a full candle body closes above the
opening range high. Stop goes at the midpoint of the opening range. Take profit at two times the
risk. One contract. Only trade the first hour of the session. No indicators, pure price action.`;

async function pickStrategyByName(page: Page, name: RegExp) {
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name }).first().click();
}

test.describe("STR-03 — AI Extract → strategy → backtest (live, metered, run once)", () => {
  test.describe.configure({ timeout: 360_000 });

  test("transcript becomes a saved strategy that backtests to a completed run", async ({ page }) => {
    await login(page, PRO.email, PRO.password);

    // 1) AI Extract — paste a transcript and generate
    await page.goto("/strategies/extract");
    await expect(page.getByText(/AI Strategy Extractor/i)).toBeVisible();
    await expect(page.getByText(/AI Strategy Extraction is a Pro feature/i)).toHaveCount(0); // must be unlocked
    await page.locator("textarea").first().fill(TRANSCRIPT);
    await page.getByRole("button", { name: /extract|generate|analy[sz]e/i }).first().click();

    // 2) A structured strategy renders (entry / exit / risk) — this is the metered Claude call
    await expect(page.getByText(/entry|breakout|long/i).first()).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText(/stop|risk/i).first()).toBeVisible();
    await expect(page.getByText(/target|take profit|2:1|2x/i).first()).toBeVisible();

    // 3) Save it
    const saveName = `QA AI Extract ${Date.now()}`;
    await page.getByPlaceholder(/name|title/i).first().fill(saveName).catch(() => {});
    await page.getByRole("button", { name: /save/i }).first().click();
    await page.goto("/strategies");
    await expect(page.getByText(saveName)).toBeVisible({ timeout: 20_000 }); // persisted

    // 4) Backtest it — SHORT range (ADR-043: seconds), NO-STOP path is thinner coverage, but the
    //    extracted strategy defines a stop, so run as extracted. One real run (Pro cap applies).
    await page.goto("/backtesting");
    await expect(page.getByText(/Configure backtest/i)).toBeVisible();
    await pickStrategyByName(page, new RegExp(saveName.slice(0, 12), "i"));
    await page.getByPlaceholder("YYYY-MM-DD").first().fill("2024-01-01").catch(() => {});
    await page.getByPlaceholder("YYYY-MM-DD").nth(1).fill("2024-01-31").catch(() => {});
    await page.getByRole("button", { name: /run backtest/i }).click();

    // 5) Results render (completed run)
    await expect(page.getByText(/Net Profit|Net P&L|Total Trades|Engine v/i).first()).toBeVisible({ timeout: 300_000 });
  });
});
