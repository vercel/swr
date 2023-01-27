import React, { Suspense } from 'react'
import useSWR from 'swr'
import {
  createKey,
  createResponse,
  renderWithConfig,
  hydrateWithConfig,
  mockConsoleForHydrationErrors,
  sleep
} from './utils'

describe('useSWR - streaming', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('should match ssr result when hydrating', async () => {
    const ensureAndUnmock = mockConsoleForHydrationErrors()

    const key = createKey()

    // A block fetches the data and updates the cache.
    function Block() {
      const { data } = useSWR(key, () => createResponse('SWR', { delay: 10 }))
      return <div>{data || 'undefined'}</div>
    }

    const container = document.createElement('div')
    container.innerHTML = '<div>undefined</div>'
    await hydrateWithConfig(<Block />, container)
    ensureAndUnmock()
  })

  // NOTE: this test is failing because it's not possible to test this behavior
  // in JSDOM. We need to test this in a real browser.
  it.failing(
    'should match the ssr result when streaming and partially hydrating',
    async () => {
      const key = createKey()

      const dataDuringHydration = {}

      // A block fetches the data and updates the cache.
      function Block({ suspense, delay, id }) {
        const { data } = useSWR(key, () => createResponse('SWR', { delay }), {
          suspense
        })

        // The first render is always hydration in our case.
        if (!dataDuringHydration[id]) {
          dataDuringHydration[id] = data || 'undefined'
        }

        return <div>{data || 'undefined'}</div>
      }

      // In this example, a will be hydrated first and b will still be streamed.
      // When a is hydrated, it will update the client cache to SWR, and when
      // b is being hydrated, it should NOT read that cache.
      renderWithConfig(
        <>
          <Block id="a" suspense={false} delay={10} />
          <Suspense fallback={null}>
            <Block id="b" suspense={true} delay={20} />
          </Suspense>
        </>
      )

      // The SSR result will always be 2 undefined values because data fetching won't
      // happen on the server:
      //   <div>undefined</div>
      //   <div>undefined</div>

      // Wait for streaming to finish.
      await sleep(50)

      expect(dataDuringHydration).toEqual({
        a: 'undefined',
        b: 'undefined'
      })
    }
  )
})
