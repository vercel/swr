import { expect, test } from '@playwright/test'

test.describe('render-suspense-fallback', () => {
  test('shows fallback before rendering resolved data', async ({ page }) => {
    await page.goto('./render-suspense-fallback', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toBeVisible()
    await expect(page.getByTestId('data')).toHaveText('SWR')
  })
})
