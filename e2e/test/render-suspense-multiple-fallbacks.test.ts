import { expect, test } from '@playwright/test'

test.describe('render-suspense-multiple-fallbacks', () => {
  test('keeps showing fallback while multiple resources resolve', async ({
    page
  }) => {
    await page.goto('./render-suspense-multiple-fallbacks', {
      waitUntil: 'commit'
    })

    const fallback = page.getByTestId('fallback')
    await expect(fallback).toBeVisible()

    await page.waitForTimeout(80)
    await expect(fallback).toBeVisible()

    await page.waitForTimeout(120)
    await expect(page.getByTestId('data')).toHaveText('3')
  })
})
