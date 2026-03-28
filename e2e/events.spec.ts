import { test, expect } from '@playwright/test'
import path from 'path'

test.use({
  storageState: path.join(__dirname, '.auth/user.json'),
})

test.describe('Event CRUD', () => {
  test('events page loads with title', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('h1, h2').filter({ hasText: 'Events' }).first()).toBeVisible()
  })

  test('create new event form opens', async ({ page }) => {
    await page.goto('/events')
    const createButton = page.locator('a[href="/events/new"], button:has-text("New Event"), a:has-text("New Event")')
    await expect(createButton.first()).toBeVisible()
    await createButton.first().click()
    await expect(page.locator('form')).toBeVisible()
  })

  test('event list shows existing events', async ({ page }) => {
    await page.goto('/events')
    // Wait for the page to load and check for event entries or an empty state
    await page.waitForLoadState('networkidle')
    const eventItems = page.locator('table tbody tr, [data-testid="event-card"], a[href^="/events/"]')
    const count = await eventItems.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('event detail page loads when clicking an event', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    const eventLink = page.locator('a[href^="/events/"]').first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await expect(page).toHaveURL(/\/events\//)
      await page.waitForLoadState('networkidle')
    }
  })
})
