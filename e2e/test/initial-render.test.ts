import { test, expect } from '@playwright/test'

test.describe('rendering', () => {
  test('suspense with preload', async ({ page }) => {
    await page.goto('./suspense-after-preload', { waitUntil: 'commit' })
    await page.getByRole('button', { name: 'preload' }).click()
    await expect(page.getByText('suspense-after-preload')).toBeVisible()
  })

  test('should be able to retry in suspense with react 19 (app router)', async ({
    page
  }) => {
    await page.goto('./suspense-retry', { waitUntil: 'commit' })
    await expect(page.getByText('Something went wrong')).toBeVisible()
    await page.getByRole('button', { name: 'retry' }).click()
    await expect(page.getByText('data: SWR suspense retry works')).toBeVisible()
  })

  test('should be able to retry in suspense with react 19 (pages router)', async ({
    page
  }) => {
    await page.goto('./suspense-retry-19', { waitUntil: 'commit' })
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

  test('should be able to use `unstable_serialize` in server component', async ({
    page
  }) => {
    await page.goto('./react-server-entry', { waitUntil: 'commit' })
    await expect(page.getByText('unstable_serialize: useSWR')).toBeVisible()
    await expect(
      page.getByText('infinite_unstable_serialize: $inf$useSWRInfinite')
    ).toBeVisible()
  })
})
