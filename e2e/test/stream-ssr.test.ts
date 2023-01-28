/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

test.describe('Stream SSR', () => {
  test('Basic SSR', async ({ page }) => {
    const log: any[] = []
    await page.exposeFunction('consoleError', (msg: any) => log.push(msg))
    await page.addInitScript(`
      const onError = window.onerror
      window.onerror = (...args) => {
        consoleError(...args)
        onError(...args)
      }
    `)
    await page.goto('./basic-ssr', { waitUntil: 'commit' })
    await expect(page.getByText('result:undefined')).toBeVisible()
    await expect(page.getByText('result:SSR Works')).toBeVisible()
    await expect(page.getByText('history:[null,"SSR Works"]')).toBeVisible()
    expect(log).toHaveLength(0)
  })

  test('Partially Hydrate', async ({ page }) => {
    const log: any[] = []
    await page.exposeFunction('consoleError', (msg: any) => log.push(msg))
    await page.addInitScript(`
      const onError = window.onerror
      window.onerror = (...args) => {
        consoleError(...args)
        onError(...args)
      }
    `)
    await page.goto('./partially-hydrate', { waitUntil: 'commit' })
    await expect(page.getByText('first data:undefined')).toBeVisible()
    await expect(
      page.getByText('second data (delayed hydration):undefined')
    ).toBeVisible()
    await expect(page.getByText('first data:SSR Works')).toBeVisible()
    await expect(
      page.getByText('second data (delayed hydration):SSR Works')
    ).toBeVisible()
    await expect(
      page.getByText('first history:[null,"SSR Works"]')
    ).toBeVisible()
    await expect(
      page.getByText('second history:[null,"SSR Works"]')
    ).toBeVisible()
    expect(log).toHaveLength(0)
  })
})
