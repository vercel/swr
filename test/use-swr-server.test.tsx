// This test case covers special environments such as React <= 17 and SSR.

import { screen, render } from '@testing-library/react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Keep React as the shared singleton while isolated module registries import SWR.
// https://github.com/jestjs/jest/issues/11471
jest.mock('react', () => jest.requireActual('react'))

async function withServer(runner: () => Promise<void>) {
  // Import SWR in a fresh module registry so server globals are observed at
  // import time and module-level promises are not tagged by earlier tests.
  await jest.isolateModulesAsync(async () => {
    await runner()
  })
}

describe('useSWR - SSR', () => {
  describe('preload on server', () => {
    beforeAll(() => {
      // @ts-expect-error
      global.window.Deno = '1'
    })

    afterAll(() => {
      // @ts-expect-error
      delete global.window.Deno
    })

    it('should be a no-op on the server', async () => {
      await withServer(async () => {
        const { preload } = await import('swr')

        const fetcher = jest.fn(() => 'data')
        const result = preload('test-key', fetcher)

        // preload should return undefined on the server
        expect(result).toBeUndefined()
        // fetcher should not be called on the server
        expect(fetcher).not.toHaveBeenCalled()
      })
    })
  })

  describe('IS_SERVER flag', () => {
    beforeAll(() => {
      // Store the original window object
      // @ts-expect-error
      global.window.Deno = '1'

      // Mock window to undefined
      // delete global.window;
    })

    afterAll(() => {
      // Restore window back to its original value
      // @ts-expect-error
      delete global.window.Deno
    })

    it('should enable the IS_SERVER flag - suspense on server without fallback', async () => {
      await withServer(async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
        const useSWR = (await import('swr')).default

        const key = Math.random().toString()

        const Page = () => {
          const { data } = useSWR(key, () => 'SWR', {
            suspense: true
          })
          return <div>{data || 'empty'}</div>
        }

        render(
          <ErrorBoundary
            fallbackRender={({ error }) => {
              console.error(error)
              return <div>{error.message}</div>
            }}
          >
            <Suspense>
              <Page />
            </Suspense>
          </ErrorBoundary>
        )

        await screen.findByText(
          'Fallback data is required when using Suspense in SSR.'
        )
      })
    })

    it('should not suspend when fallbackData is a fulfilled promise', async () => {
      await withServer(async () => {
        // Import SWR inside the isolated module registry so earlier tests cannot
        // hide this regression by letting React tag module-level thenables first.
        const useSWR = (await import('swr')).default
        const fallbackData = Promise.resolve('fallback data')
        // React can pass already-fulfilled server promises as tagged thenables.
        // This simulates that shape so the test isolates SWR's Suspense path.
        // @ts-expect-error modify react promise status
        fallbackData.status = 'fulfilled'
        // @ts-expect-error modify react promise value
        fallbackData.value = 'fallback data'

        const Page = () => {
          const { data } = useSWR('suspense-fulfilled-fallback', () => 'SWR', {
            fallbackData,
            // Avoid stale revalidation so the only suspend candidate is SWR's no-op promise.
            revalidateIfStale: false,
            suspense: true
          })
          return <div>{data}</div>
        }

        render(
          <Suspense fallback={<div>loading</div>}>
            <Page />
          </Suspense>
        )

        // Any fallback render means SWR suspended despite fulfilled fallback data.
        const loadingFallback = screen.queryByText('loading')
        expect(loadingFallback === null).toBe(true)
        screen.getByText('fallback data')
      })
    })
  })

  describe('strictServerPrefetchWarning', () => {
    it('should show console warning on when strictServerPrefetchWarning is enabled', async () => {
      await withServer(async () => {
        const warnings: string[] = []

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(msg => {
          warnings.push(msg as string)
        })

        const { default: useSWR, SWRConfig } = await import('swr')

        let resolve: (() => void) | null = null
        const promise = new Promise<void>(r => {
          resolve = r
        })

        const Page = () => {
          useSWR('ssr:1', () => 'SWR')
          useSWR('ssr:2', () => 'SWR')
          useSWR('ssr:3', () => 'SWR', { strictServerPrefetchWarning: false })
          useSWR('ssr:4', () => 'SWR', { fallbackData: 'SWR' })
          useSWR('ssr:5', () => 'SWR')

          resolve!()

          return null
        }

        render(
          <SWRConfig
            value={{
              strictServerPrefetchWarning: true,
              fallback: {
                'ssr:5': 'SWR'
              }
            }}
          >
            <Page />
          </SWRConfig>,
          {
            hydrate: true
          }
        )

        await promise

        expect(warnings).toMatchInlineSnapshot(`
          [
            "Missing pre-initiated data for serialized key "ssr:1" during server-side rendering. Data fetching should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.",
            "Missing pre-initiated data for serialized key "ssr:2" during server-side rendering. Data fetching should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.",
          ]
        `)

        warnSpy.mockClear()
      })
    })
  })
})
