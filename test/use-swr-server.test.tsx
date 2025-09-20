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
})
