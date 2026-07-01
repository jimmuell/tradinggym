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

// Idle Run button only — NOT the disabled "Running backtest…". The button also carries a
// "⌘↵" hint in its accessible name ("Run backtest ⌘↵"), so this is start-anchored (no `$`),
// which still excludes "Running backtest…" (that name starts with "running…", not "run ").
const RUN_IDLE = /^run backtest/i;

// Wait until no backtest is running on this account (shared admin state can carry a run over):
// during a run the button is replaced by the disabled "Running backtest…", so the idle button
// being present again means the run has finished.
async function waitForNoRunInProgress(page: Page) {
  await expect(page.getByRole('button', { name: RUN_IDLE }))
    .toBeVisible({ timeout: 300_000 });
}

async function runAndWaitForCommissionCard(page: Page) {
  const runBtn = page.getByRole('button', { name: RUN_IDLE });
  await waitForNoRunInProgress(page);                       // don't click into a busy run
  await expect(runBtn).toBeEnabled({ timeout: 30_000 });    // strategy chosen -> enabled
  await runBtn.click();
  // The button flips to a disabled "Running backtest…"; wait for it to return to idle so we
  // assert on THIS run's result, not a stale card from a previous run.
  await expect(runBtn).toBeVisible({ timeout: 300_000 });
  await page.getByText('What commission cost you').first()
    .waitFor({ state: 'visible', timeout: 120_000 });
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
  // A /run/compare backtest runs four engine runs (~up to 2 min each); the flip test runs two.
  // Override the global 30 s timeout for this slow, backtest-driven spec only.
  test.describe.configure({ timeout: 360_000 });

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await page.goto('/backtesting');
    await page.waitForLoadState('networkidle');
    // Shared admin state can carry a prior test's run over — wait it out before configuring.
    await waitForNoRunInProgress(page);
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
    const runBtn = page.getByRole('button', { name: RUN_IDLE });
    await waitForNoRunInProgress(page);                     // the first run must have finished
    await expect(runBtn).toBeEnabled({ timeout: 30_000 });
    await runBtn.click();
    await expect(page.getByText(/flipped this from a win to a loss/i))
      .toBeVisible({ timeout: 120_000 });
  });

  test('zero commission shows the no-commission nudge', async ({ page }) => {
    await baseConfig(page, '0');
    await runAndWaitForCommissionCard(page);
    await expect(page.getByText(/no commission set/i)).toBeVisible();
  });
});
