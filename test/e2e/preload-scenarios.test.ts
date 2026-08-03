import { expect, test } from '@playwright/test'

test.describe('preload scenarios', () => {
  test('preloads fetcher before mount', async ({ page }) => {
    await page.goto('./render-preload-basic', { waitUntil: 'commit' })

    await expect(page.getByTestId('data')).toHaveText('data:foo')
    await expect(page.getByTestId('fetch-count')).toHaveText('fetches: 1')
  })

  test('avoids suspense waterfall when preloading multiple resources', async ({
    page
  }) => {
    await page.goto('./render-preload-avoid-waterfall', {
      waitUntil: 'commit'
    })
    await expect(page.getByTestId('fallback')).toBeVisible()
    await page.waitForTimeout(200)
    await expect(page.getByTestId('fallback')).not.toBeVisible()
    await expect(page.getByTestId('data')).toHaveText('data:foo:bar')
  })
})
