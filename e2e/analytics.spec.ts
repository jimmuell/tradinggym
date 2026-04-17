import { test, expect } from '@playwright/test';

// Requires auth state in e2e/.auth.json
// Run strategies.spec.ts first if auth is stale

test.use({ storageState: 'e2e/.auth.json' });

test.describe('Analytics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('tab', { name: /performance/i })).toBeVisible();
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

  test('renders Blueprint Accuracy card', async ({ page }) => {
    // Scroll to bottom of page to ensure the streaks row is in viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const card = page.locator('span.text-muted-foreground', { hasText: 'Blueprint Accuracy' });
    await expect(card).toBeVisible({ timeout: 10000 });
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

  test('Distribution tab renders Win/Loss stat block', async ({ page }) => {
    await page.getByRole('tab', { name: /distribution/i }).click();
    // Wait for the active tab panel — Win/Loss Distribution heading is inside it
    await expect(page.getByText('Win/Loss Distribution')).toBeVisible({ timeout: 10000 });
    // WinLossStats labels — scope to the active tab panel to avoid hidden panels
    const panel = page.locator('[role="tabpanel"]:visible');
    await expect(panel.getByText('Wins')).toBeVisible();
    await expect(panel.getByText('Losses')).toBeVisible();
    await expect(panel.getByText('Breakevens')).toBeVisible();
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
