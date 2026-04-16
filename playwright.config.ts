import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL || "https://keen-chart-clone.lovable.app",
    trace: "on-first-retry",
  },
});
