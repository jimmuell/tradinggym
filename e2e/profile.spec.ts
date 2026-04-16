import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? ''
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD ?? ''

test.describe('Profile Save — P15', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000)
    const page = await browser.newPage()
    await page.goto('/auth')

    await page.getByText('Welcome back').waitFor({ state: 'visible', timeout: 30000 })
    await page.getByRole('textbox', { name: 'you@example.com' }).fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(/\/(dashboard|strategies|simulator)/, { timeout: 30000 })

    await page.context().storageState({ path: 'e2e/.auth.json' })
    await page.close()
  })

  test.use({ storageState: 'e2e/.auth.json' })

  test('profile page loads with display name populated', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    const input = page.locator('input#displayName')
    const value = await input.inputValue()
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
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeEnabled()
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
    const saved = await page.locator('input#displayName').inputValue()
    expect(saved).toBe(updated)
  })

  test('Save button is disabled again after successful save', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForSelector('input#displayName', { timeout: 8000 })
    await page.locator('input#displayName').fill('Post Save Test')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 6000 })
    const btn = page.getByRole('button', { name: /save/i })
    await expect(btn).toBeDisabled()
  })
})
