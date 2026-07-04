import { expect, test } from '@playwright/test'

test.describe('promise scenarios', () => {
  test('suspends while resolving fallback promise', async ({ page }) => {
    await page.goto('./render-promise-suspense-resolve', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    const history = page.getByTestId('history')

    await expect(history).toContainText('"initial data"')

    await expect(page.getByTestId('data')).toHaveText('data:new data')
    await expect(history).toHaveText('history:["initial data","new data"]')

    await expect(page.getByTestId('fallback')).toHaveCount(0)
  })

  test('surfaces error boundary when fallback promise rejects', async ({
    page
  }) => {
    await page.goto('./render-promise-suspense-error', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    await expect(page.getByTestId('error')).toHaveText('error')
    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(page.getByTestId('data')).toHaveCount(0)
  })

  test('resolves shared fallback promise once for multiple consumers', async ({
    page
  }) => {
    await page.goto('./render-promise-suspense-shared', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('fallback')).toBeVisible()

    await expect(page.getByTestId('data-first')).toHaveText('data:value')
    await expect(page.getByTestId('data-second')).toHaveText('data:value')
    await expect(page.getByTestId('fallback')).toHaveCount(0)
  })

  test('hydrates preload cacheData into the client cache', async ({ page }) => {
    let clientFetcherCalls = 0
    await page.exposeFunction('__SWR_RSC_CLIENT_FETCHER_CALLED__', () => {
      clientFetcherCalls += 1
    })

    await page.goto('./rsc-unstable-preload', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('data')).toHaveText(
      'data:SWR_RSC_PRELOAD_FLIGHT_MARKER_20260621'
    )
    await expect(page.getByTestId('cache')).toHaveText(
      'cache:SWR_RSC_PRELOAD_FLIGHT_MARKER_20260621'
    )
    await expect(page.getByTestId('client-fetches')).toHaveText(
      'client fetches:0'
    )
    await expect(page.getByTestId('fallback')).toHaveCount(0)
    await expect(
      page.getByText('CLIENT_FETCHER_RESULT_AFTER_TRIGGER')
    ).toHaveCount(0)
    expect(clientFetcherCalls).toBe(0)

    await page.getByTestId('revalidate').click()

    await expect.poll(() => clientFetcherCalls).toBe(1)
    await expect(page.getByTestId('data')).toHaveText(
      'data:CLIENT_FETCHER_RESULT_AFTER_TRIGGER'
    )
    await expect(page.getByTestId('cache')).toHaveText(
      'cache:CLIENT_FETCHER_RESULT_AFTER_TRIGGER'
    )
    await expect(page.getByTestId('client-fetches')).toHaveText(
      'client fetches:1'
    )
  })

  test('uses preload cacheData without suspense and skips the client fetcher', async ({
    page
  }) => {
    let clientFetcherCalls = 0
    await page.exposeFunction('__SWR_RSC_CLIENT_FETCHER_CALLED__', () => {
      clientFetcherCalls += 1
    })

    await page.goto('./rsc-unstable-preload-no-suspense', {
      waitUntil: 'commit'
    })

    await expect(page.getByTestId('data')).toHaveText(
      'data:SWR_RSC_PRELOAD_NO_SUSPENSE_MARKER_20260621'
    )
    await expect(page.getByTestId('loading')).toHaveText('loading:false')
    await expect(page.getByTestId('validating')).toHaveText('validating:false')
    await expect(page.getByTestId('cache')).toHaveText(
      'cache:SWR_RSC_PRELOAD_NO_SUSPENSE_MARKER_20260621'
    )
    await expect(page.getByTestId('client-fetches')).toHaveText(
      'client fetches:0'
    )
    await expect(
      page.getByText('CLIENT_FETCHER_RESULT_AFTER_TRIGGER')
    ).toHaveCount(0)
    expect(clientFetcherCalls).toBe(0)

    await page.getByTestId('revalidate').click()

    await expect.poll(() => clientFetcherCalls).toBe(1)
    await expect(page.getByTestId('data')).toHaveText(
      'data:CLIENT_FETCHER_RESULT_AFTER_TRIGGER'
    )
    await expect(page.getByTestId('cache')).toHaveText(
      'cache:CLIENT_FETCHER_RESULT_AFTER_TRIGGER'
    )
    await expect(page.getByTestId('client-fetches')).toHaveText(
      'client fetches:1'
    )
  })

  test('does not leak preloaded cacheData across requests', async ({
    request
  }) => {
    const marker = 'SWR_RSC_PRELOAD_CONDITIONAL_MARKER_20260621'

    // A request that preloads on the server renders the server-loaded value.
    const preloaded = await request.get(
      './rsc-unstable-preload-conditional?preload=1'
    )
    expect(await preloaded.text()).toContain(marker)

    // A later request that does not preload must not reuse the previous
    // request's server-loaded value. SWR's global state is shared across
    // requests on the server, so the server output must not contain the marker.
    const notPreloaded = await request.get('./rsc-unstable-preload-conditional')
    expect(await notPreloaded.text()).not.toContain(marker)
  })
})
