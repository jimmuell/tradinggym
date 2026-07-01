import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { TEST_ACCOUNTS } from './auth.env';

// The teach panel only appears when a stop is set (edge fn routes to /run/compare),
// and only renders three cards when the engine emits three teaching blocks (v25.6.0).

async function setField(page: Page, id: string, value: string) {
  const input = page.locator(`#${id}`).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill('');          // NumericField is string-draft; clear then type
  await input.fill(value);
  await input.blur();            // commit via onCommit
}

async function runAndWaitForCommissionCard(page: Page) {
  await page.getByRole('button', { name: /run backtest/i }).click();
  // /run/compare now executes four engine runs (primary + 3 variants) — be patient.
  await page.getByText('What commission cost you').first()
    .waitFor({ state: 'visible', timeout: 90_000 });
}

// Run backtest stays disabled until a strategy is chosen — pick the first available.
async function selectFirstStrategy(page: Page) {
  await page.getByRole('combobox').first().click();
  await page.getByRole('option').first().click();
}

async function baseConfig(page: Page, commission: string) {
  await setField(page, 'stop-input', '2');
  await setField(page, 'target-input', '8');
  await setField(page, 'qty-value', '1');
  await setField(page, 'commission-input', commission);
}

test.describe('Commission teaching card (TEACH-COMPARE dim 3)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/backtesting');
    await page.waitForLoadState('networkidle');
    await selectFirstStrategy(page);
  });

  test('renders three teaching cards and commission math ties out', async ({ page }) => {
    await baseConfig(page, '1.24');
    await runAndWaitForCommissionCard(page);

    // All three cards present (implicitly asserts same_signal true + all dims).
    await expect(page.getByText('What your stop did')).toBeVisible();
    await expect(page.getByText('What your take-profit did')).toBeVisible();
    await expect(page.getByText('What commission cost you')).toBeVisible();

    // Relationship check: total == count × 1.24, and per-RT text is 1.24.
    const line = await page.getByText(/Commission COST you .*per round-trip/).innerText();
    const m = line.match(/\$([\d,]+\.?\d*)\s+across\s+(\d+)\s+trades\D+\$([\d.]+)\s+per round-trip/i);
    expect(m, `could not parse commission line: "${line}"`).not.toBeNull();
    const total = parseFloat(m![1].replace(/,/g, ''));
    const count = parseInt(m![2], 10);
    const perRt = parseFloat(m![3]);
    expect(perRt).toBeCloseTo(1.24, 2);
    expect(Math.abs(total - count * 1.24)).toBeLessThan(0.01);
  });

  test('commission flips a pre-fee-profitable run into a loss', async ({ page }) => {
    await baseConfig(page, '1.24');
    await runAndWaitForCommissionCard(page);

    // Read "Before fees" net from the normal-cost card body.
    const beforeLine = await page.getByText(/Before fees:/).innerText();
    const bm = beforeLine.match(/Before fees:\s*(-?)\$([\d,]+\.?\d*)/);
    expect(bm, `could not parse before-fees: "${beforeLine}"`).not.toBeNull();
    const beforeNet = (bm![1] === '-' ? -1 : 1) * parseFloat(bm![2].replace(/,/g, ''));

    test.skip(beforeNet <= 0, 'Base run is not profitable before fees — cannot flip.');

    // Absurd commission guarantees primary goes negative while variant stays positive.
    await setField(page, 'commission-input', '1000');
    await page.getByRole('button', { name: /run backtest/i }).click();
    await expect(page.getByText(/flipped this from a win to a loss/i))
      .toBeVisible({ timeout: 90_000 });
  });

  test('zero commission shows the no-commission nudge', async ({ page }) => {
    await baseConfig(page, '0');
    await runAndWaitForCommissionCard(page);
    await expect(page.getByText(/no commission set/i)).toBeVisible();
  });
});
