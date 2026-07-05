import { test, expect } from "@playwright/test";
import { forceAdminTier, stubCompletedRun } from "./helpers/tier";
import noStopResultsDetail from "./fixtures/no-stop-run.json" with { type: "json" };

test.use({ storageState: "e2e/.auth.json" });

// Deterministic, quota-free coverage of the commission teaching card. No real backtests: the tier
// is forced to admin and a COMPLETED run row carrying a tailored _teaching commission block is
// served from a mock, so BacktestTeachPanel renders the card straight from data.
//
// This replaces the former real-run spec (admin login + live /run/compare, ~2 min, metered 5/mo)
// per docs/BACKTESTING_SMOKE_PLAN.md — a real end-to-end backtest is a manual step, not automated.
// It also supersedes PR #19, which hardened that real-run approach rather than moving off it.
//
// The card branches on the commission block (see BacktestTeachPanel.CommissionCardBody):
//   total_commission <= 0        -> "no commission set" nudge
//   flips_profitability === true -> "flipped this from a win to a loss"
//   otherwise                    -> "Commission COST you $X across N trades … $Y per round-trip"

type Teaching = Record<string, unknown> & { dimension: string };

// The no-stop fixture's other five teaching blocks + _same_signal:true, with the commission block
// swapped for the scenario under test, so the full teach panel still renders around it.
function detailWithCommission(commission: Teaching) {
  const base = noStopResultsDetail as { _teaching: Teaching[] } & Record<string, unknown>;
  return {
    ...base,
    _same_signal: true,
    _teaching: base._teaching.map((t) => (t.dimension === "commission" ? commission : t)),
  };
}

test.describe("Commission teaching card (deterministic, mocked)", () => {
  test("renders the commission card and the per-round-trip math ties out", async ({ page }) => {
    await forceAdminTier(page);
    // 21779.36 / 17564 == exactly 1.24 per round-trip.
    await stubCompletedRun(page, detailWithCommission({
      dimension: "commission",
      direction: "cost",
      significance: "cost",
      delta_net: -21779.36,
      delta_ci_low: -22500,
      delta_ci_high: -21000,
      trade_count: 17564,
      sufficient_data: true,
      total_commission: 21779.36,
      flips_profitability: false,
      primary_net: -49386,
      variant_net: -27606.64,
    }));
    await page.goto("/backtesting");

    await expect(page.getByText("What commission cost you")).toBeVisible();

    // Relationship check: total == count × per-round-trip, and the per-RT figure is $1.24.
    const line = await page.getByText(/Commission COST you .*per round-trip/).innerText();
    const m = line.match(/\$([\d,]+\.?\d*)\s+across\s+(\d+)\s+trades\D+\$([\d.]+)\s+per round-trip/i);
    expect(m, `could not parse commission line: "${line}"`).not.toBeNull();
    const total = parseFloat(m![1].replace(/,/g, ""));
    const count = parseInt(m![2], 10);
    const perRt = parseFloat(m![3]);
    expect(perRt).toBeCloseTo(1.24, 2);
    expect(Math.abs(total - count * 1.24)).toBeLessThan(0.01);
  });

  test("commission that flips a win into a loss shows the flip headline", async ({ page }) => {
    await forceAdminTier(page);
    // Before fees +$500; after $21,779.36 in fees -> finished at -$21,279.36 (a flip).
    await stubCompletedRun(page, detailWithCommission({
      dimension: "commission",
      direction: "cost",
      significance: "cost",
      delta_net: -21779.36,
      delta_ci_low: -22500,
      delta_ci_high: -21000,
      trade_count: 17564,
      sufficient_data: true,
      total_commission: 21779.36,
      flips_profitability: true,
      variant_net: 500,
      primary_net: -21279.36,
    }));
    await page.goto("/backtesting");

    await expect(page.getByText("What commission cost you")).toBeVisible();
    await expect(page.getByText(/flipped this from a win to a loss/i)).toBeVisible();
  });

  test("zero commission shows the no-commission nudge", async ({ page }) => {
    await forceAdminTier(page);
    await stubCompletedRun(page, detailWithCommission({
      dimension: "commission",
      direction: "neutral",
      significance: "inconclusive",
      delta_net: 0,
      delta_ci_low: 0,
      delta_ci_high: 0,
      trade_count: 17564,
      sufficient_data: true,
      total_commission: 0,
      flips_profitability: false,
      primary_net: -49386,
      variant_net: -49386,
    }));
    await page.goto("/backtesting");

    await expect(page.getByText("What commission cost you")).toBeVisible();
    await expect(page.getByText(/no commission set/i)).toBeVisible();
  });
});
