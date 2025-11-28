// This test case covers special environments such as React <= 17 and SSR.

import { screen, render } from '@testing-library/react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// https://github.com/jestjs/jest/issues/11471
jest.mock('react', () => jest.requireActual('react'))

async function withServer(runner: () => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    await runner()
  })
}

describe('useSWR - SSR', () => {
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
            "Missing pre-initiated data for serialized key "ssr:1" during server-side rendering. Data fethcing should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.",
            "Missing pre-initiated data for serialized key "ssr:2" during server-side rendering. Data fethcing should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.",
          ]
        `)

        warnSpy.mockClear()
      })
    })
  })
})
