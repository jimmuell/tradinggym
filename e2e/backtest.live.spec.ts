import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";
import fs from "node:fs";

// LIVE recompute tier — a REAL backtest end-to-end (app → engine → completed run → teach cards).
// EXCLUDED from the default suite (playwright.config: chromium ignores *.live.spec.ts + the `live`
// project only exists when RUN_LIVE_BACKTESTS=true). Run it with `npm run test:e2e:live`.
//
// Opposite of the saved-replay-data specs: NOTHING is forced/stubbed. It authenticates as ADMIN
// (unmetered — admin bypasses outOfCredits, so it never touches the Pro 5/month cap) and reproduces
// the recorded c9accb3b scenario: NO stop, strategy "ORB — Pure Price Action", 2024-01-01..2024-01-31.
// That 1-month range reliably yields ~81 trades (verified against existing runs — the 1-week quick
// preset gives only ~16-19, borderline for sufficient_data), so all six _teaching dims populate.
//
// Owns: live app↔engine contract, infra reachability, engine-output drift. Does NOT re-verify P&L
// math — numeric correctness lives in the mes-orb-strategy engine test suite.

const STRATEGY = "ORB — Pure Price Action";
const START = { year: "2024", month: "January", day: "1" };
const END = { year: "2024", month: "January", day: "31" };

// Small pinned reference (captured once from a real run — see docs/BACKTESTING_SMOKE_PLAN.md).
// Absent on the first capture run: the spec then verifies contract + logs the observed values.
const REF_PATH = "e2e/fixtures/live-reference.json";
type LiveRef = { engine_version: string; total_trades: number; net_pnl: number };
const ref: LiveRef | null = fs.existsSync(REF_PATH)
  ? JSON.parse(fs.readFileSync(REF_PATH, "utf8"))
  : null;

// --- PR #19 gating, copied verbatim from c81a2e5 (NOT cherry-picked — the source file was rewritten).
const RUN_IDLE = /^run backtest/i;
async function waitForNoRunInProgress(page: Page) {
  await expect(page.getByRole("button", { name: RUN_IDLE })).toBeVisible({ timeout: 300_000 });
}

async function selectStrategyByName(page: Page, name: string) {
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name }).click();
}

// Drive the DatePickerField calendar (react-day-picker v8, dropdown-buttons caption: month then year).
async function pickDate(
  page: Page,
  triggerId: string,
  { year, month, day }: { year: string; month: string; day: string },
) {
  await page.locator(`#${triggerId}`).click();
  const cal = page.locator(".rdp");
  await expect(cal).toBeVisible();
  const selects = cal.locator("select");
  await selects.nth(0).selectOption({ label: month });
  await selects.nth(1).selectOption(year);
  // in-month day only (exclude prev/next-month outside days)
  await cal.locator("button:not(.day-outside)").filter({ hasText: new RegExp(`^${day}$`) }).first().click();
}

function parseMoney(s: string | null): number {
  const neg = /-/.test(s ?? "");
  const n = parseFloat((s ?? "").replace(/[^0-9.]/g, ""));
  return neg ? -n : n;
}

// Value <p> of a KPI card, located via its label <p> sibling (see BacktestKpiCards).
function kpiValue(page: Page, label: string) {
  return page
    .locator("p", { hasText: new RegExp(`^${label}$`) })
    .first()
    .locator("xpath=following-sibling::p")
    .first();
}

test.describe("Live backtest recompute (real run — admin, unmetered)", () => {
  // A real /run/compare is multiple engine runs; override the global 30s timeout for this spec only.
  test.describe.configure({ timeout: 360_000 });

  test("real no-stop run completes and renders all 6 teach cards; output within drift bounds", async ({
    page,
  }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto("/backtesting");
    await page.waitForLoadState("networkidle");
    await waitForNoRunInProgress(page); // shared admin state may carry a prior run over

    await selectStrategyByName(page, STRATEGY);
    await pickDate(page, "bt-start-date", START);
    await pickDate(page, "bt-end-date", END);

    // Run with defaults (no stop). Wait for THIS run to finish: the button returns to idle and a
    // teach title appears. A timeout here is a legitimate infra signal (engine/Railway down/slow).
    const runBtn = page.getByRole("button", { name: RUN_IDLE });
    await expect(runBtn).toBeEnabled({ timeout: 30_000 });
    await runBtn.click();
    await expect(
      runBtn,
      "infra: run never returned to idle within 5min — engine/Railway down or overloaded?",
    ).toBeVisible({ timeout: 300_000 });
    await page.getByText("What your stop did").first().waitFor({ state: "visible", timeout: 300_000 });

    // --- (a) Contract: all six cards render from a REAL results_detail, with no fallback/placeholder.
    for (const title of [
      "What your stop did",
      "What your take-profit did",
      "What commission cost you",
      "What your direction choice did",
      "What slippage cost you",
      "What your position size did",
    ]) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByText(/No teaching data was returned/i)).toHaveCount(0);
    await expect(page.getByText(/couldn't produce a reliable comparison/i)).toHaveCount(0); // _same_signal === true
    await expect(page.getByText(/No data for this dimension in this run/i)).toHaveCount(0); // all six dims emitted

    // --- read engine output (for drift)
    const totalTrades = parseInt((await kpiValue(page, "Total Trades").innerText()).trim(), 10);
    const netPnl = parseMoney(await kpiValue(page, "Net Profit").getAttribute("title"));
    const engineVersion =
      (await page.getByText(/Engine v/).first().innerText()).match(/Engine v([\w.-]+)/)?.[1] ?? "?";

    console.log(`[live] engine_version=${engineVersion} total_trades=${totalTrades} net_pnl=${netPnl}`);
    expect(totalTrades, "no-stop run produced 0 trades — range too short or engine issue").toBeGreaterThan(0);

    // --- (b) Drift: hard-assert numbers vs the pinned reference; WARN (don't fail) on version alone.
    if (ref) {
      if (engineVersion !== ref.engine_version) {
        console.warn(
          `[live][engine_version] ${engineVersion} != reference ${ref.engine_version} — if the numbers below also changed, this is a legit engine change: re-capture e2e/fixtures/live-reference.json.`,
        );
      }
      expect(totalTrades, "engine-output drift: total_trades changed vs reference").toBe(ref.total_trades);
      expect(netPnl, "engine-output drift: net_pnl changed vs reference").toBeCloseTo(ref.net_pnl, 2);
    } else {
      console.log(
        "[live] no live-reference.json yet (capture run). Pin { engine_version, total_trades, net_pnl } to enable drift assertions.",
      );
    }
  });
});
