import { test, expect } from '@playwright/test';

// Requires auth state in e2e/.auth.json
// Run strategies.spec.ts first if auth is stale

test.use({ storageState: 'e2e/.auth.json' });

test.describe('Analytics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    // Wait for Performance tab panel to be visible before each test
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
    // Blueprint Accuracy is in the streaks row at the bottom of Performance tab
    await expect(page.getByText('Blueprint Accuracy')).toBeVisible({ timeout: 10000 });
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
    const distTab = page.getByRole('tab', { name: /distribution/i });
    await distTab.click();
    // Wait for the tab panel to activate
    await expect(page.getByText('Win/Loss Distribution')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Wins')).toBeVisible();
    await expect(page.getByText('Losses')).toBeVisible();
    await expect(page.getByText('Breakevens')).toBeVisible();
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
