import { expect, test } from '@playwright/test'

test.describe('render-suspense-error', () => {
  test('surfaces boundary error after suspense fallback', async ({ page }) => {
    await page.goto('./render-suspense-error', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toBeVisible()
    await expect(page.getByTestId('error')).toBeVisible()
  })
})
