/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'
test.describe('rendering', () => {
  test('should only render once if the result of swr is not used', async ({
    page
  }) => {
    const log: any[] = []
    await page.exposeFunction('onRender', (msg: any) => log.push(msg))
    await page.goto('./initial-render', { waitUntil: 'commit' })
    await expect(page.getByText('SWRTest')).toBeVisible()
    expect(log).toHaveLength(1)
  })
})
