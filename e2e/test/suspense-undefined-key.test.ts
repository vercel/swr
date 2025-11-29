import { test, expect } from '@playwright/test'

test.describe('suspense with undefined key', () => {
  test('should render correctly when key is undefined', async ({ page }) => {
    await page.goto('./suspense-undefined-key', { waitUntil: 'commit' })

    // Should show content for undefined key (not suspense)
    await expect(page.getByText('empty')).toBeVisible()

    // Click toggle to enable key
    await page.getByRole('button', { name: 'toggle' }).click()

    // Should show loading fallback when key becomes defined
    await expect(page.getByText('fallback')).toBeVisible()

    // Should eventually show the fetched data
    await expect(page.getByText('SWR')).toBeVisible()
  })
})
