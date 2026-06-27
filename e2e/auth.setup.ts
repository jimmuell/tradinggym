import { test as setup } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const AUTH_FILE = "e2e/.auth.json";

// Runs once per `npx playwright test` invocation (as a project dependency), so the
// shared Pro session in e2e/.auth.json is always fresh — specs that reuse it
// (profile, analytics) no longer depend on strategies.spec.ts running first, and a
// single spec can run in isolation without a stale-session bounce to /auth.
setup("authenticate as pro", async ({ page }) => {
  await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
  await page.context().storageState({ path: AUTH_FILE });
});
