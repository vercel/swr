import { test, expect } from '@playwright/test'

test('renders Suspense fallbacks on the server and fetches in the browser', async ({
  browser,
  page
}) => {
  // Inspect the rendered server HTML with JavaScript disabled, so hydration
  // cannot hide an SSR regression or replace a server-rendered fallback.
  const serverContext = await browser.newContext({ javaScriptEnabled: false })
  try {
    const serverPage = await serverContext.newPage()
    await serverPage.goto('http://localhost:4000/suspense-browser')
    await expect(serverPage.getByTestId('browser-fallback')).toBeVisible()
    await expect(serverPage.getByTestId('infinite-fallback')).toBeVisible()
    await expect(serverPage.getByTestId('server-data')).toHaveText(
      'server data'
    )
    await expect(serverPage.getByTestId('disabled-data')).toHaveText('disabled')
    await expect(serverPage.getByTestId('preloaded-data')).toHaveText(
      'preloaded data'
    )
    await expect(serverPage.getByTestId('browser-data')).toHaveCount(0)
    await expect(serverPage.getByTestId('infinite-data')).toHaveCount(0)
  } finally {
    await serverContext.close()
  }

  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/suspense-browser')
  await expect(page.getByTestId('browser-data')).toHaveText('client:browser')
  await expect(page.getByTestId('infinite-data')).toHaveText('client:infinite')
  await expect(page.getByTestId('server-data')).toHaveText('server data')
  await expect(page.getByTestId('disabled-data')).toHaveText('disabled')
  await expect(page.getByTestId('preloaded-data')).toHaveText('preloaded data')
  await expect(page.getByTestId('browser-fallback')).toHaveCount(0)
  await expect(page.getByTestId('infinite-fallback')).toHaveCount(0)
  expect(errors).toEqual([])
})
