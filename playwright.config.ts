import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

// Load test env (PLAYWRIGHT_BASE_URL / credentials) so a bare `npx playwright test`
// targets the same origin the stored sessions are scoped to.
dotenv.config({ path: ".env.test" });

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "https://keen-chart-clone.lovable.app";

// The "live" tier runs a REAL backtest (app → engine → completed run). It is EXCLUDED from the
// default suite two ways: the chromium project ignores *.live.spec.ts, and the `live` project is
// only registered when RUN_LIVE_BACKTESTS=true (see `npm run test:e2e:live`).
const RUN_LIVE = process.env.RUN_LIVE_BACKTESTS === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Authenticates once and writes e2e/.auth.json before the suite runs, so specs
    // that reuse the shared Pro session don't depend on ordering or a warm token.
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: [/.*\.setup\.ts/, /.*\.live\.spec\.ts/],
      dependencies: ["setup"],
    },
    // On-demand live-recompute tier — only present when explicitly opted in.
    ...(RUN_LIVE
      ? [
          {
            name: "live",
            testMatch: /.*\.live\.spec\.ts/,
            dependencies: ["setup"],
          },
        ]
      : []),
  ],
});
