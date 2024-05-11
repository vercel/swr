/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

test.describe('suspense fallback', () => {
  test('should wait for promise fallback value to be resolved', async ({
    page
  }) => {
    await page.goto('./suspense-fallback/promise', { waitUntil: 'commit' })
    await expect(page.getByText('async promise')).toBeVisible()
  })
})
