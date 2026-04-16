import { test, expect } from '@playwright/test'

async function signIn(page: any) {
  await page.goto('/auth')
  await page.getByLabel(/email/i).fill(process.env.TEST_EMAIL ?? 'test@tradegym.app')
  await page.getByLabel(/password/i).fill(process.env.TEST_PASSWORD ?? 'TestPassword123!')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

test.describe('Profile Save — P15', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto('/profile')
    await page.waitForSelector('input[name="displayName"], input[placeholder*="name" i]', {
      timeout: 8000,
    })
  })

  test('profile page loads with display name populated', async ({ page }) => {
    const input = page.locator('input[name="displayName"], input[placeholder*="name" i]').first()
    const value = await input.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('Save button is disabled when value is unchanged', async ({ page }) => {
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeDisabled()
  })

  test('Save button enables after editing display name', async ({ page }) => {
    const input = page.locator('input[name="displayName"], input[placeholder*="name" i]').first()
    await input.fill('TradeGYM Tester')
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeEnabled()
  })

  test('saves display name and shows success toast', async ({ page }) => {
    const input = page.locator('input[name="displayName"], input[placeholder*="name" i]').first()
    const original = await input.inputValue()
    const updated = original === 'TradeGYM Tester' ? 'Jim T' : 'TradeGYM Tester'
    await input.fill(updated)
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })
    await page.reload()
    await page.waitForSelector('input[name="displayName"], input[placeholder*="name" i]', {
      timeout: 8000,
    })
    const saved = await page
      .locator('input[name="displayName"], input[placeholder*="name" i]')
      .first()
      .inputValue()
    expect(saved).toBe(updated)
  })

  test('Save button is disabled again after successful save', async ({ page }) => {
    const input = page.locator('input[name="displayName"], input[placeholder*="name" i]').first()
    await input.fill('Post Save Test')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeDisabled()
  })
})
