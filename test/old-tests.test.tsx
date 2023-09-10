import React, { useEffect, useState } from 'react'
import {
  createKey,
  createResponse,
  executeWithoutBatching,
  renderWithConfig,
  sleep
} from './utils'
import useSWR from 'swr'
import { act, fireEvent, screen } from '@testing-library/react'

describe('old tests - only kept as reference', () => {
  // https://codesandbox.io/s/concurrent-swr-case-ii-lr6x4u
  it.skip('should do state updates in transitions', async () => {
    const key1 = createKey()
    const key2 = createKey()

    const log = []

    function Counter() {
      const [count, setCount] = React.useState(0)

      React.useEffect(() => {
        const interval = setInterval(() => {
          setCount(x => x + 1)
        }, 20)
        return () => clearInterval(interval)
      }, [])

      log.push(count)

      return <>{count}</>
    }

    function Body() {
      useSWR(key2, () => createResponse(true, { delay: 1000 }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 0,
        suspense: true
      })
      return null
    }

    function Page() {
      const { data } = useSWR(key1, () => createResponse(true, { delay: 50 }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 0
      })

      return (
        <>
          <Counter />
          {data ? <Body /> : null}
        </>
      )
    }

    await executeWithoutBatching(async () => {
      renderWithConfig(<Page />)
      await sleep(500)
    })
  })

  it.skip('should not trigger the onLoadingSlow and onSuccess event after component unmount', async () => {
    const key = createKey()
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(key, () => createResponse('SWR'), {
        onLoadingSlow: loadingKey => {
          loadingSlow = loadingKey
        },
        onSuccess: (_, successKey) => {
          success = successKey
        },
        loadingTimeout: 100
      })
      return <div>hello, {data}</div>
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    renderWithConfig(<App />)
    screen.getByText('hello,')
    expect(loadingSlow).toEqual(null)
    expect(success).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(() => sleep(200))
    expect(success).toEqual(null)
    expect(loadingSlow).toEqual(null)
  })

  it.skip('should not trigger the onError and onErrorRetry event after component unmount', async () => {
    const key = createKey()
    let retry = null,
      failed = null
    function Page() {
      const { data } = useSWR(key, () => createResponse(new Error('error!')), {
        onError: (_, errorKey) => {
          failed = errorKey
        },
        onErrorRetry: (_, errorKey) => {
          retry = errorKey
        },
        dedupingInterval: 0
      })
      return (
        <div>
          <>hello, {data}</>
        </div>
      )
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    renderWithConfig(<App />)
    screen.getByText('hello,')
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(() => sleep(200))
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)
  })
  // https://github.com/vercel/swr/pull/1003
  it.skip('should not dedupe synchronous mutations', async () => {
    const mutationRecivedValues = []
    const renderRecivedValues = []

    const key = createKey()
    function Component() {
      const { data, mutate: boundMutate } = useSWR(key, () => 0)

      useEffect(() => {
        setTimeout(() => {
          // let's mutate twice, synchronously
          boundMutate(v => {
            mutationRecivedValues.push(v) // should be 0
            return 1
          }, false)
          boundMutate(v => {
            mutationRecivedValues.push(v) // should be 1
            return 2
          }, false)
        }, 1)
        // the mutate function is guaranteed to be the same reference
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      renderRecivedValues.push(data) // should be 0 -> 2, never render 1 in between
      return null
    }

    renderWithConfig(<Component />)

    await executeWithoutBatching(() => sleep(50))
    expect(mutationRecivedValues).toEqual([0, 1])
    expect(renderRecivedValues).toEqual([undefined, 0, 1, 2])
  })
})
