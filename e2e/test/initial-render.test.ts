/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

const sleep = async (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

test.describe('rendering', () => {
  test('should only render once if the result of swr is not used', async ({
    page
  }) => {
    const log: any[] = []
    await page.exposeFunction('onRender', (msg: any) => log.push(msg))
    await page.goto('./initial-render', { waitUntil: 'commit' })
    await expect(page.getByText('SWRTest')).toBeVisible()
    await sleep(1200)
    expect(log).toHaveLength(1)
  })
})
