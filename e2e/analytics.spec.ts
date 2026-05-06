import { test, expect } from '@playwright/test';

// Requires auth state in e2e/.auth.json
// Run strategies.spec.ts first if auth is stale

test.use({ storageState: 'e2e/.auth.json' });

test.describe('Analytics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible({ timeout: 10000 });
    // Default tab is now Live Trading — click Performance to activate it
    await page.getByRole('tab', { name: /performance/i }).click();
    await page.waitForTimeout(500);
  });

  test('renders page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('renders three tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /performance/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /distribution/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /journal/i })).toBeVisible();
  });

  test('renders all 8 metric cards on Performance tab', async ({ page }) => {
    const labels = [
      'Total P&L',
      'Win Rate',
      'Profit Factor',
      'Avg Winner',
      'Avg Loser',
      'Best Trade',
      'Worst Trade',
      'Total Trades',
    ];
    for (const label of labels) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test('Blueprint Accuracy and Win/Loss labels exist in DOM', async ({ page }) => {
    // Use JS to check text presence in the full DOM including hidden tab panels
    const blueprintFound = await page.evaluate(() =>
      document.body.innerText.includes('Blueprint Accuracy')
    );
    expect(blueprintFound).toBe(true);

    // Switch to Distribution tab then verify Win/Loss labels in DOM
    await page.getByRole('tab', { name: /distribution/i }).click();
    await page.waitForTimeout(500);
    const winsFound = await page.evaluate(() =>
      document.body.innerText.includes('Wins')
    );
    expect(winsFound).toBe(true);
  });

  test('time range selector is present and defaults to All Time', async ({ page }) => {
    const select = page.getByRole('combobox');
    await expect(select).toBeVisible();
    await expect(select).toContainText(/all time/i);
  });

  test('time range selector changes filter', async ({ page }) => {
    const select = page.getByRole('combobox');
    await select.click();
    await page.getByRole('option', { name: /this month/i }).click();
    await expect(select).toContainText(/this month/i);
  });

  test('Journal tab renders empty state', async ({ page }) => {
    await page.getByRole('tab', { name: /journal/i }).click();
    await expect(page.getByText(/no journal entries yet/i)).toBeVisible();
  });

  test('equity curve chart area is present', async ({ page }) => {
    await expect(page.getByText('Equity Curve')).toBeVisible();
  });

  test('daily P&L chart area is present', async ({ page }) => {
    await expect(page.getByText('Daily P&L')).toBeVisible();
  });
});
