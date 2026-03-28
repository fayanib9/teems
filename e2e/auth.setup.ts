import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'admin@toada.com')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
  await expect(page.locator('text=TEEMS')).toBeVisible()
  await page.context().storageState({ path: authFile })
})
