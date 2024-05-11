// This test case covers special environments such as React <= 17.

import { act, screen, render, fireEvent } from '@testing-library/react'

// https://github.com/jestjs/jest/issues/11471
jest.mock('react', () => jest.requireActual('react'))

async function withLegacyReact(runner: () => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    await runner()
  })
}

describe('useSWR - legacy React', () => {
  ;(process.env.__SWR_TEST_BUILD ? it.skip : it)(
    'should enable the IS_REACT_LEGACY flag - startTransition',
    async () => {
      await withLegacyReact(async () => {
        // Test mutation and trigger
        const useSWRMutation = (await import('swr/mutation')).default

        const waitForNextTick = () =>
          act(() => new Promise(resolve => setTimeout(resolve, 1)))
        const key = Math.random().toString()

        function Page() {
          const { data, trigger } = useSWRMutation(key, () => 'data')
          return <button onClick={() => trigger()}>{data || 'pending'}</button>
        }

        render(<Page />)

        // mount
        await screen.findByText('pending')

        fireEvent.click(screen.getByText('pending'))
        await waitForNextTick()

        screen.getByText('data')
      })
    }
  )

  // https://github.com/vercel/swr/blob/cfcfa9e320a59742d41a77e52003127b04378c4f/src/core/use-swr.ts#L345
  ;(process.env.__SWR_TEST_BUILD ? it.skip : it)(
    'should enable the IS_REACT_LEGACY flag - unmount check',
    async () => {
      await withLegacyReact(async () => {
        const useSWR = (await import('swr')).default

        const key = Math.random().toString()

        function Page() {
          // No fallback data
          const { data } = useSWR(
            key,
            () =>
              new Promise<string>(resolve =>
                setTimeout(() => resolve('data'), 100)
              ),
            {
              loadingTimeout: 10
            }
          )
          return <p>{data || 'pending'}</p>
        }

        render(<Page />)

        await screen.findByText('data')
      })
    }
  )
})
