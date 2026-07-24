import { test, expect } from '@playwright/test'

test.describe('suspense with undefined key', () => {
  test('should render correctly when key is undefined', async ({ page }) => {
    await page.goto('./suspense-undefined-key', { waitUntil: 'commit' })

    // Should show content for undefined key (not suspense)
    await expect(page.getByText('empty')).toBeVisible()

    // Click toggle to enable key. A click that lands before hydration is
    // dropped, so retry until the suspense fallback appears.
    await expect(async () => {
      await page.getByRole('button', { name: 'toggle' }).click()
      await expect(page.getByText('fallback')).toBeVisible({ timeout: 300 })
    }).toPass()

    // Should eventually show the fetched data
    await expect(page.getByText('SWR')).toBeVisible()
  })
})
