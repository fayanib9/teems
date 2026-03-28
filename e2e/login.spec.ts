import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'admin@toada.com')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'admin@toada.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.text-red-500')).toBeVisible()
  })

  test('empty form shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    // HTML5 required validation prevents submission
    const emailInput = page.locator('#email')
    await expect(emailInput).toHaveAttribute('required', '')
    const passwordInput = page.locator('#password')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('logout works', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('#email', 'admin@toada.com')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Click user menu and sign out
    await page.click('text=Sign out')
    await page.waitForURL('/login')
    await expect(page).toHaveURL(/\/login/)
  })
})
