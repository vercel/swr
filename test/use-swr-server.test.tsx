// This test case covers special environments such as React <= 17 and SSR.

import { screen, render } from '@testing-library/react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// https://github.com/jestjs/jest/issues/11471
jest.mock('react', () => jest.requireActual('react'))

async function withServer(runner: () => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    process.env.__SWR_TEST_SERVER = '1'

    try {
      await runner()
    } finally {
      process.env.__SWR_TEST_SERVER = ''
    }
  })
}

describe('useSWR - SSR', () => {
  ;(process.env.__SWR_TEST_BUILD ? it.skip : it)(
    'should enable the IS_SERVER flag - suspense on server without fallback',
    async () => {
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
    }
  )
})
