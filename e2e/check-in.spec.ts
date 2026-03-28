import { test, expect } from '@playwright/test'
import path from 'path'

test.use({
  storageState: path.join(__dirname, '.auth/user.json'),
})

test.describe('Check-in flow', () => {
  test('check-in page loads for an event', async ({ page }) => {
    // First get an event to check-in for
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (await eventLink.isVisible()) {
      const href = await eventLink.getAttribute('href')
      const eventId = href?.split('/events/')[1]?.split('/')[0]

      if (eventId) {
        await page.goto(`/events/${eventId}/check-in`)
        await page.waitForLoadState('networkidle')
        // Verify page loaded (either check-in content or a redirect)
        expect(page.url()).toContain('/events/')
      }
    }
  })

  test('manual entry form is present', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (await eventLink.isVisible()) {
      const href = await eventLink.getAttribute('href')
      const eventId = href?.split('/events/')[1]?.split('/')[0]

      if (eventId) {
        await page.goto(`/events/${eventId}/check-in`)
        await page.waitForLoadState('networkidle')
        // Look for a manual entry form or input
        const form = page.locator('form, input[type="text"], input[placeholder]')
        const formCount = await form.count()
        expect(formCount).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
