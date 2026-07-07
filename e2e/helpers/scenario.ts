import type { Page } from "@playwright/test";
import scenario from "../fixtures/orb-guided-scenario.json" with { type: "json" };

// Serve the guided ORB scenario from saved replay data — a real strategy_playback_scenarios row
// (db83bd35, tagged 'guided'; setup=2, confirmation=5, entry=8, exit=11; entry 4785.5 / stop 4782.875
// / target 4790.75) captured verbatim. This makes the walkthrough deterministic and independent of
// the live DB row staying put. Same route-intercept pattern as e2e/helpers/tier.ts.
//
// usePlaybackScenario queries .eq('id',…).eq('is_active',true).maybeSingle() → return a single
// OBJECT for the by-id query; useActivePlaybackScenarios does a plain list select → return an array.
export async function stubGuidedScenario(page: Page) {
  await page.route("**/rest/v1/strategy_playback_scenarios*", async (route) => {
    const byId = route.request().url().includes("id=eq.");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: byId ? JSON.stringify(scenario) : JSON.stringify([scenario]),
    });
  });
}
