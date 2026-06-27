import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth");

  await page
    .getByText("Welcome back")
    .waitFor({ state: "visible", timeout: 30000 });

  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[type="password"]').first().fill(password);

  await page.getByRole("button", { name: /^log in$/i }).click();

  await page.waitForURL(/\/(dashboard|strategies|simulator|analytics)/, {
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle");
}
