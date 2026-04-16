import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://id-preview--b6ddf0f1-bdc6-4f0d-8935-25a10ca87691.lovable.app",
    trace: "on-first-retry",
  },
});
