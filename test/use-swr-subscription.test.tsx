import { fireEvent, screen } from '@testing-library/react'
import { sleep, renderWithConfig, createKey } from './utils'
import useSWRSubscription from 'swr/subscription'
import useSWR from 'swr'
import { useEffect, useState, act } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

describe('useSWRSubscription', () => {
  it('should update the state', async () => {
    const swrKey = createKey()

    let intervalId
    let res = 0
    function subscribe(key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key)
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      return (
        <>
          <div data-testid="data">{'data:' + data}</div>
          <div data-testid="error">
            {'error:' + (error ? error.message : '')}
          </div>
        </>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`data:fallback`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}0`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}1`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}2`)
    screen.getByText('error:')
    await act(() => sleep(100))
    // error occurred, error arrives instead of data 3
    screen.getByText(`data:${swrKey}2`)
    screen.getByText(`error:${swrKey}`)
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}4`)
    screen.getByText('error:')
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`error:`)
  })

  it('should pass the origin keys', async () => {
    const swrKey = createKey()
    let intervalId
    let res = 0
    function subscribe(key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key)
          next(err)
        } else {
          next(undefined, key[0] + res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription(() => [swrKey], subscribe, {
        fallbackData: 'fallback'
      })
      return (
        <>
          <div data-testid="data">{'data:' + data}</div>
          <div data-testid="error">
            {'error:' + (error ? error.message : '')}
          </div>
        </>
      )
    }
    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`data:fallback`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}0`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}1`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}2`)
    screen.getByText('error:')
    await act(() => sleep(100))
    // error occurred, error arrives instead of data 3
    screen.getByText(`data:${swrKey}2`)
    screen.getByText(`error:${swrKey}`)
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}4`)
    screen.getByText('error:')
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`error:`)
  })

  it('should support updating keys', async () => {
    const swrKey = createKey()
    const subscriptions: string[] = []

    function subscribe(key, { next }) {
      subscriptions.push(key)
      next(undefined, key)
      return () => {}
    }

    function Page() {
      const [key, setKey] = useState(undefined)
      const { data } = useSWRSubscription(key, subscribe, {
        fallbackData: 'fallback'
      })

      useEffect(() => {
        const timeout = setTimeout(() => {
          setKey(swrKey)
        }, 100)
        return () => clearTimeout(timeout)
      }, [])

      return <div data-testid="data">{'data:' + data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText(`data:fallback`)
    await act(() => sleep(100))
    await screen.findByText(`data:` + swrKey)

    // `undefined` should not trigger a subscription.
    expect(subscriptions).toEqual([swrKey])
  })

  it('should deduplicate subscriptions', async () => {
    const swrKey = createKey()

    let subscriptionCount = 0

    function subscribe(key, { next }) {
      ++subscriptionCount
      let res = 0
      const intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key + 'error')
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {
        clearInterval(intervalId)
      }
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      useSWRSubscription(swrKey, subscribe)
      useSWRSubscription(swrKey, subscribe)

      return <div>{error ? error.message : data}</div>
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`fallback`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}0`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}1`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}2`)

    expect(subscriptionCount).toBe(1)
  })

  it('should not conflict with useSWR state', async () => {
    const swrKey = createKey()

    function subscribe(key, { next }) {
      let res = 0
      const intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key + 'error')
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {
        clearInterval(intervalId)
      }
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      const { data: swrData } = useSWR(swrKey, () => 'swr')
      return (
        <div>
          {swrData}:{error ? error.message : data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`swr:fallback`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}0`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}1`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}2`)
  })

  it('should support singleton subscription', async () => {
    const placeholderFn: (data: number) => void = () => {}
    let callback: (data: number) => void = placeholderFn
    const sub = (fn: (data: number) => void) => {
      callback = fn
      return () => {
        callback = placeholderFn
      }
    }
    const emit = (data: number) => {
      callback(data)
    }
    const useSubData = (key: number) =>
      useSWRSubscription(key.toString(), (_, { next }) =>
        sub(data => next(null, data + key))
      )
    const App = () => {
      const [key, setKey] = useState(0)
      const { data } = useSubData(key)
      useEffect(() => {
        callback(1)
      }, [])
      return (
        <div className="App">
          <p>key: {key}</p>
          <p className="read-the-docs">data: {data}</p>
          <button
            onClick={() => {
              setKey(value => value + 1)
              setTimeout(() => {
                emit(2)
              }, 100)
            }}
          >
            add
          </button>
        </div>
      )
    }
    renderWithConfig(<App />)
    await screen.findByText(`key: 0`)
    await screen.findByText(`data: 1`)
    fireEvent.click(screen.getByText('add'))
    await act(() => sleep(100))
    await screen.findByText(`key: 1`)
    await screen.findByText(`data: 3`)
  })

  it('should require a dispose function', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const swrKey = createKey()

    function subscribe() {
      return 'no-dispose'
    }

    function Page() {
      useSWRSubscription(swrKey, subscribe)
      return null
    }

    renderWithConfig(
      <ErrorBoundary
        fallbackRender={({ error }) => {
          return <div>{error.message}</div>
        }}
      >
        <Page />
      </ErrorBoundary>
    )

    await screen.findByText(
      'The `subscribe` function must return a function to unsubscribe.'
    )
  })

  it('should clean up the subscription state after the last subscriber unmounts', async () => {
    const swrKey = createKey()

    let subscribeCount = 0
    let disposeCount = 0

    function subscribe(key, { next }) {
      ++subscribeCount
      next(undefined, key)
      return () => {
        ++disposeCount
      }
    }

    function Sub() {
      useSWRSubscription(swrKey, subscribe)
      useSWRSubscription(swrKey, subscribe)
      useSWRSubscription(swrKey, subscribe)
      return null
    }

    function Page() {
      const [mounted, setMounted] = useState(true)
      return (
        <>
          <button onClick={() => setMounted(v => !v)}>toggle</button>
          {mounted ? <Sub /> : null}
        </>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))

    // Multiple hooks with the same key share a single subscription.
    expect(subscribeCount).toBe(1)
    expect(disposeCount).toBe(0)

    // Unmounting the last subscriber disposes the subscription.
    fireEvent.click(screen.getByText('toggle'))
    expect(disposeCount).toBe(1)

    // The state is fully cleaned up, so remounting starts fresh.
    fireEvent.click(screen.getByText('toggle'))
    expect(subscribeCount).toBe(2)
    expect(disposeCount).toBe(1)
  })
  it.each(['data', 'error', 'updater'] as const)(
    'should ignore a late %s update from a disposed subscription after remount',
    async kind => {
      const key = createKey()
      const callbacks: Array<(error: Error | null, data?: any) => void> = []
      const dispose = jest.fn()
      const staleUpdater = jest.fn(() => 'stale')
      function subscribe(_, { next }) {
        callbacks.push(next)
        return dispose
      }
      function Sub() {
        const { data, error } = useSWRSubscription(key, subscribe)
        return <div>{error ? error.message : data || 'empty'}</div>
      }
      function Page() {
        const [mounted, setMounted] = useState(true)
        return (
          <>
            <button onClick={() => setMounted(v => !v)}>toggle</button>
            {mounted ? <Sub /> : null}
          </>
        )
      }
      renderWithConfig(<Page />)
      await act(async () => callbacks[0](null, 'first'))
      screen.getByText('first')
      fireEvent.click(screen.getByText('toggle'))
      expect(dispose).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByText('toggle'))
      expect(callbacks).toHaveLength(2)
      await act(async () => callbacks[1](null, 'current'))
      screen.getByText('current')
      await act(async () => {
        if (kind === 'error') callbacks[0](new Error('stale error'))
        else callbacks[0](null, kind === 'updater' ? staleUpdater : 'stale')
      })
      screen.getByText('current')
      expect(staleUpdater).not.toHaveBeenCalled()
    }
  )

  it('should ignore updates emitted synchronously by the disposer', async () => {
    const key = createKey()
    const cache = new Map()
    function subscribe(_, { next }) {
      next(null, 'active')
      return () => next(new Error('disposed'))
    }
    function Sub() {
      const { data, error } = useSWRSubscription(key, subscribe)
      return <div>{error ? error.message : data}</div>
    }
    const { unmount } = renderWithConfig(<Sub />, { provider: () => cache })
    await screen.findByText('active')
    unmount()
    expect(cache.get('$sub$' + key).error).toBeUndefined()
  })

  it('should keep the shared subscription active after its first subscriber unmounts', async () => {
    const key = createKey()
    let emit: (error: Error | null, data: string) => void
    const dispose = jest.fn()
    const subscribe = jest.fn((_, { next }) => {
      emit = next
      return dispose
    })
    function Sub({ name }: { name: string }) {
      const { data } = useSWRSubscription(key, subscribe)
      return (
        <div>
          {name}:{data}
        </div>
      )
    }
    function Page() {
      const [first, setFirst] = useState(true)
      return (
        <>
          <button onClick={() => setFirst(false)}>remove first</button>
          {first ? <Sub name="first" /> : null}
          <Sub name="second" />
        </>
      )
    }
    renderWithConfig(<Page />)
    expect(subscribe).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('remove first'))
    expect(dispose).not.toHaveBeenCalled()
    await act(async () => emit(null, 'still active'))
    screen.getByText('second:still active')
  })
})
