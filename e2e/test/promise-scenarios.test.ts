import { expect, test } from '@playwright/test'

test.describe('promise scenarios', () => {
  test('suspends while resolving fallback promise', async ({ page }) => {
    await page.goto('./render-promise-suspense-resolve', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    const history = page.getByTestId('history')

    await expect(history).toContainText('"initial data"')

    await expect(page.getByTestId('data')).toHaveText('data:new data')
    await expect(history).toHaveText('history:["initial data","new data"]')

    await expect(page.getByTestId('fallback')).toHaveCount(0)
  })

  test('surfaces error boundary when fallback promise rejects', async ({
    page
  }) => {
    await page.goto('./render-promise-suspense-error', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    await expect(page.getByTestId('error')).toHaveText('error')
    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data')).toHaveCount(0)
  })

  test('resolves shared fallback promise once for multiple consumers', async ({
    page
  }) => {
    await page.goto('./render-promise-suspense-shared', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    await expect(page.getByTestId('data-first')).toHaveText('data:value')
    await expect(page.getByTestId('data-second')).toHaveText('data:value')
    await expect(page.getByTestId('fallback')).toHaveCount(0)
  })
})
