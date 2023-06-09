/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

test.describe('rendering', () => {
  test('suspense with preload', async ({ page }) => {
    await page.goto('./suspense-after-preload', { waitUntil: 'commit' })
    await page.getByRole('button', { name: 'preload' }).click()
    await expect(page.getByText('suspense-after-preload')).toBeVisible()
  })
  test('should be able to retry in suspense with react 18.3', async ({
    page
  }) => {
    await page.goto('./suspense-retry-18-3', { waitUntil: 'commit' })
    await expect(page.getByText('Something went wrong')).toBeVisible()
    await page.getByRole('button', { name: 'retry' }).click()
    await expect(page.getByText('data: SWR suspense retry works')).toBeVisible()
  })
  test('should be able to retry in suspense with react 18.2', async ({
    page
  }) => {
    await page.goto('./suspense-retry-18-2', { waitUntil: 'commit' })
    await expect(page.getByText('Something went wrong')).toBeVisible()
    await page.getByRole('button', { name: 'retry' }).click()
    await expect(page.getByText('data: SWR suspense retry works')).toBeVisible()
  })
  test('should be able to retry in suspense with mutate', async ({ page }) => {
    await page.goto('./suspense-retry-mutate', { waitUntil: 'commit' })
    await expect(page.getByText('Something went wrong')).toBeVisible()
    await page.getByRole('button', { name: 'retry' }).click()
    await expect(page.getByText('data: SWR suspense retry works')).toBeVisible()
  })
})
