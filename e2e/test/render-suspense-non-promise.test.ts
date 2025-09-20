import { expect, test } from '@playwright/test'

test.describe('render-suspense-non-promise', () => {
  test('renders synchronously resolved data without showing fallback', async ({
    page
  }) => {
    await page.goto('./render-suspense-non-promise', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data')).toHaveText('hello')
  })
})
