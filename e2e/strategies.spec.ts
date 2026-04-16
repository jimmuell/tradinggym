import { test, expect } from '../playwright-fixture';

test.describe('Strategy CRUD lifecycle', () => {
  test.describe.configure({ mode: 'serial', timeout: 60000 });

  const testEmail = 'your-test-email@example.com';
  const testPassword = 'your-test-password';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/(?!.*\/auth).*/, { timeout: 15000 });
    await page.context().storageState({ path: '/tmp/auth-state.json' });
    await page.close();
  });

  test.use({ storageState: '/tmp/auth-state.json' });

  const strategyName = `E2E Test Strategy ${Date.now()}`;
  const renamedName = `E2E Renamed ${Date.now()}`;

  test('create a strategy and verify it appears in My Strategies', async ({ page }) => {
    // Navigate to strategies page
    await page.goto('/strategies');
    await page.getByText('TradeGYM Strategies').waitFor({ state: 'visible' });

    // Click "New Strategy" button
    await page.getByRole('button', { name: /New Strategy/i }).click();
    await page.waitForURL('**/strategies/new');

    // Fill in the name
    await page.getByPlaceholder('Strategy name').fill(strategyName);

    // Click Save
    await page.getByRole('button', { name: /Save/i }).click();

    // Wait for redirect to the created strategy's detail page
    await page.waitForURL(/\/strategies\/(?!new).+/);

    // Navigate back to the strategies list
    await page.goto('/strategies');
    await page.getByText('TradeGYM Strategies').waitFor({ state: 'visible' });

    // Verify the strategy appears
    await expect(page.getByText(strategyName)).toBeVisible();
  });

  test('edit the strategy name and verify persistence', async ({ page }) => {
    await page.goto('/strategies');
    await page.getByText('TradeGYM Strategies').waitFor({ state: 'visible' });

    // Click on the strategy card
    await page.getByText(strategyName).click();
    await page.waitForURL(/\/strategies\/(?!new).+/);

    // Edit the name
    const nameInput = page.getByPlaceholder('Strategy name');
    await nameInput.clear();
    await nameInput.fill(renamedName);

    // Save
    await page.getByRole('button', { name: /Save/i }).click();

    // Wait for the toast
    await expect(page.getByText('Strategy saved')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.getByPlaceholder('Strategy name').waitFor({ state: 'visible' });
    await expect(page.getByPlaceholder('Strategy name')).toHaveValue(renamedName);
  });

  test('delete the strategy and verify removal', async ({ page }) => {
    await page.goto('/strategies');
    await page.getByText('TradeGYM Strategies').waitFor({ state: 'visible' });

    // Open the strategy
    await page.getByText(renamedName).click();
    await page.waitForURL(/\/strategies\/(?!new).+/);

    // Click trash icon button
    await page.getByRole('button', { name: '' }).locator('svg.lucide-trash-2').locator('..').click();

    // Confirm deletion in the alert dialog
    await page.getByRole('button', { name: /Delete/i }).click();

    // Should redirect back to strategies list
    await page.waitForURL('**/strategies');

    // Verify the strategy is gone
    await expect(page.getByText(renamedName)).not.toBeVisible();
  });
});
