import { test, expect } from '@playwright/test'

test.describe('Profile Save — P15', () => {
  test.describe.configure({ mode: 'serial' })

  test.use({ storageState: 'e2e/.auth.json' })

  test('profile page loads with display name populated', async ({ page }) => {
    await page.goto('/profile')
    // Wait for the heading to confirm the page rendered
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 10000 })
    // The input is behind a Skeleton until the profile query resolves — wait for it
    const input = page.locator('input#displayName')
    await expect(input).toBeVisible({ timeout: 15000 })
    await expect(input).not.toHaveValue('', { timeout: 10000 })
    const value = await input.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('Save button is disabled when value is unchanged', async ({ page }) => {
    await page.goto('/profile')
    const input = page.locator('input#displayName')
    await expect(input).toBeVisible({ timeout: 15000 })
    await expect(input).not.toHaveValue('', { timeout: 10000 })
    await expect(page.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  test('Save button enables after editing display name', async ({ page }) => {
    await page.goto('/profile')
    const input = page.locator('input#displayName')
    await expect(input).toBeVisible({ timeout: 15000 })
    await expect(input).not.toHaveValue('', { timeout: 10000 })
    await input.fill('TradeGYM Tester')
    await expect(page.getByRole('button', { name: /save/i })).toBeEnabled()
  })

  test('saves display name and shows success toast', async ({ page }) => {
    await page.goto('/profile')
    const input = page.locator('input#displayName')
    await expect(input).toBeVisible({ timeout: 15000 })
    await expect(input).not.toHaveValue('', { timeout: 10000 })
    const original = await input.inputValue()
    const updated = original === 'TradeGYM Tester' ? 'Jim Mueller' : 'TradeGYM Tester'

    await input.fill(updated)
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })

    await page.reload()
    const reloadedInput = page.locator('input#displayName')
    await expect(reloadedInput).toBeVisible({ timeout: 15000 })
    await expect(reloadedInput).not.toHaveValue('', { timeout: 10000 })
    expect(await reloadedInput.inputValue()).toBe(updated)
  })

  test('Save button is disabled again after successful save', async ({ page }) => {
    await page.goto('/profile')
    const input = page.locator('input#displayName')
    await expect(input).toBeVisible({ timeout: 15000 })
    await expect(input).not.toHaveValue('', { timeout: 10000 })
    await input.fill('Post Save Test')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })
    await expect(page.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
