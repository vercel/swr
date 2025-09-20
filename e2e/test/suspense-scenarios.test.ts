import { expect, test } from '@playwright/test'

// Group all suspense-related scenarios so they run together.
test.describe('suspense scenarios', () => {
  test('waits for promise fallback value to resolve', async ({ page }) => {
    await page.goto('./suspense-fallback/promise', { waitUntil: 'commit' })
    await expect(page.getByText('async promise')).toBeVisible()
  })

  test('updates data when suspense key changes', async ({ page }) => {
    await page.goto('./suspense-infinite/get-key', { waitUntil: 'commit' })

    await expect(page.getByTestId('data')).toHaveText('data: A1,A2,A3')

    await page.getByRole('button', { name: 'mutate' }).click()

    await expect(page.getByTestId('data')).toHaveText('data: B1,B2,B3')
  })

  test('shows fallback before resolved data renders', async ({ page }) => {
    await page.goto('./render-suspense-fallback', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toBeVisible()
    await expect(page.getByTestId('data')).toHaveText('SWR')
  })

  test('keeps fallback visible until multiple resources resolve', async ({
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

  test('renders synchronously resolved data without fallback', async ({
    page
  }) => {
    await page.goto('./render-suspense-non-promise', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data')).toHaveText('hello')
  })

  test('surfaces error boundary after suspense fallback', async ({ page }) => {
    await page.goto('./render-suspense-error', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toBeVisible()
    await expect(page.getByTestId('error')).toBeVisible()
  })

  test.skip('retains cached data while surfacing errors', async ({ page }) => {
    await page.goto('./render-suspense-cached-error', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('result')).toHaveText('data: hello, error: ')
    await expect(page.getByTestId('result')).toHaveText(
      'data: hello, error: error'
    )
  })

  test('skips revalidation when data is cached and revalidateIfStale is false', async ({
    page
  }) => {
    await page.goto('./render-suspense-no-revalidate', { waitUntil: 'commit' })

    const data = page.getByTestId('data')
    await expect(data).toHaveText('data: cached')

    await page.waitForTimeout(200)
    await expect(data).toHaveText('data: cached')
  })

  test('pauses while key changes and resumes with new data', async ({
    page
  }) => {
    await page.goto('./render-suspense-key-change', { waitUntil: 'commit' })

    const fallback = page.getByTestId('fallback')
    const data = page.getByTestId('data')

    await expect(fallback).toBeVisible()
    await expect(data).toHaveText('data: render-suspense-key-change-initial')

    await page.getByTestId('toggle').click()

    await expect(fallback).toBeVisible()
    await expect(data).toHaveText('data: render-suspense-key-change-updated')
  })

  test('renders correctly when key changes with identical data', async ({
    page
  }) => {
    await page.goto('./render-suspense-same-data', { waitUntil: 'commit' })

    const fallback = page.getByTestId('fallback')
    const data = page.getByTestId('data')

    await expect(fallback).toBeVisible()
    await expect(data).toHaveText('data: 123,1')

    await page.getByTestId('increment').click()

    await expect(fallback).toBeVisible()
    await expect(data).toHaveText('data: 123,2')
  })

  test('renders initial data when provided', async ({ page }) => {
    await page.goto('./render-suspense-initial-data', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data')).toHaveText('hello, Initial')
    await page.waitForTimeout(200)
    await expect(page.getByTestId('data')).toHaveText('hello, SWR')
  })

  test('avoids unnecessary re-renders', async ({ page }) => {
    await page.goto('./render-suspense-avoid-rerender', { waitUntil: 'commit' })

    await expect(page.getByTestId('fallback')).toBeVisible()
    await expect(page.getByTestId('start-count')).toHaveText('start renders: 1')

    await page.waitForTimeout(200)

    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data-count')).toHaveText('data renders: 1')
    await expect(page.getByTestId('start-count')).toHaveText('start renders: 1')
  })

  test('renders fallback only once when keepPreviousData is true', async ({
    page
  }) => {
    await page.goto('./render-suspense-keep-previous', { waitUntil: 'commit' })

    const fallback = page.getByTestId('fallback')
    const data = page.getByTestId('data')

    await expect(fallback).toBeVisible()

    await expect(data).toHaveText('data:origin')
    await expect(fallback).toHaveCount(0)

    await page.getByTestId('set-next').click()

    await expect(fallback).toHaveCount(0)
    await expect(data).toHaveText('data:origin')
    await expect(data).toHaveText('data:next')
    await expect(fallback).toHaveCount(0)
  })

  test('updates fetcher reference with suspense', async ({ page }) => {
    await page.goto('./render-suspense-fetcher', { waitUntil: 'commit' })
    const fallback = page.getByTestId('fallback')

    await expect(fallback).toBeVisible()
    await page.waitForTimeout(100)
    await expect(page.getByTestId('data')).toHaveText('data:foo')

    await page.getByTestId('set-bar').click()
    await expect(fallback).toBeVisible()
    await expect(page.getByTestId('data')).toHaveText('data:bar')
  })

  test('preloads infinite data for suspense', async ({ page }) => {
    await page.goto('./render-suspense-infinite-preload', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('data')).toHaveText(
      'render-suspense-infinite-preload-0-value'
    )
    await expect(page.getByTestId('fetch-count')).toHaveText('fetches: 1')
    await expect(page.getByTestId('fallback-count')).toHaveText(
      'fallback renders: 1'
    )
    await expect(page.getByTestId('fallback')).toHaveCount(0)
  })

  test('renders correctly when key changes from null to valid', async ({
    page
  }) => {
    await page.goto('./render-suspense-null-key', { waitUntil: 'commit' })

    const data = page.getByTestId('data')

    await expect(data).toHaveText('render-suspense-null-key-123')

    await page.getByTestId('set-empty').click()
    await expect(data).toHaveText('render-suspense-null-key-nodata')

    await page.getByTestId('set-456').click()
    await expect(data).toHaveText('render-suspense-null-key-456')
  })

  test('handles undefined key toggling', async ({ page }) => {
    await page.goto('./suspense-undefined-key', { waitUntil: 'commit' })

    await expect(page.getByText('empty')).toBeVisible()

    await page.getByRole('button', { name: 'toggle' }).click()

    await expect(page.getByText('fallback')).toBeVisible()
    await expect(page.getByText('SWR')).toBeVisible()
  })
})
