import { test, expect } from '@playwright/test'

test.describe('Profile Save — P15', () => {
  test.describe.configure({ mode: 'serial' })

  // Reuse auth state saved by strategies.spec.ts beforeAll
  test.use({ storageState: 'e2e/.auth.json' })

  test('profile page loads with display name populated', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    const value = await page.locator('input#displayName').inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('Save button is disabled when value is unchanged', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeDisabled()
  })

  test('Save button enables after editing display name', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    await page.locator('input#displayName').fill('TradeGYM Tester')
    await expect(page.getByRole('button', { name: /save/i })).toBeEnabled()
  })

  test('saves display name and shows success toast', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    const input = page.locator('input#displayName')
    const original = await input.inputValue()
    const updated = original === 'TradeGYM Tester' ? 'Jim T' : 'TradeGYM Tester'

    await input.fill(updated)
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })

    await page.reload()
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    expect(await page.locator('input#displayName').inputValue()).toBe(updated)
  })

  test('Save button is disabled again after successful save', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    await page.locator('input#displayName').fill('Post Save Test')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })
    await expect(page.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
