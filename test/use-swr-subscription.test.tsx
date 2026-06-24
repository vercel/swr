import { fireEvent, screen } from '@testing-library/react'
import { sleep, renderWithConfig, createKey } from './utils'
import useSWRSubscription from 'swr/subscription'
import useSWR, { SWRConfig } from 'swr'
import { render } from '@testing-library/react'
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

  // Issue #4261: when the last subscriber for a key unmounts, the disposer
  // must run exactly once and the key must be torn down so that re-mounting
  // the same key starts a fresh subscription instead of reusing a stale one.
  // The leak is asserted through the public contract (subscribe/dispose call
  // counts) rather than the internal bookkeeping Maps, so the assertions hold
  // against both the source and the built package.
  describe('teardown disposes and resubscribes by contract (#4261)', () => {
    /** Render under an explicit per-test cache so subscriptions stay isolated. */
    function renderWithExplicitCache(
      element: React.ReactElement,
      cache: Map<any, any>
    ) {
      return render(
        <SWRConfig value={{ provider: () => cache }}>{element}</SWRConfig>
      )
    }

    /** A subscribe spy whose return value is a per-call dispose spy. */
    function trackedSubscribe() {
      const disposers: jest.Mock[] = []
      const subscribe = jest.fn(
        (_key: any, { next }: { next: (e: any, d: any) => void }) => {
          next(null, _key)
          const dispose = jest.fn()
          disposers.push(dispose)
          return dispose
        }
      )
      return { subscribe, disposers }
    }

    // Duplicate subscribers of the same key share a single subscribe call.
    it('subscribes once for duplicate subscribers of a key', () => {
      const cache = new Map()
      const swrKey = createKey()
      const { subscribe } = trackedSubscribe()
      function Page() {
        useSWRSubscription(swrKey, subscribe)
        useSWRSubscription(swrKey, subscribe)
        return null
      }
      renderWithExplicitCache(<Page />, cache)

      expect(subscribe).toHaveBeenCalledTimes(1)
    })

    // Unmounting a non-last subscriber must not dispose the live subscription.
    it('does not dispose while another subscriber is still mounted', () => {
      const cache = new Map()
      const swrKey = createKey()
      const { subscribe, disposers } = trackedSubscribe()
      function Page() {
        useSWRSubscription(swrKey, subscribe)
        return null
      }
      const { unmount: unmountFirst } = renderWithExplicitCache(<Page />, cache)
      const { unmount: unmountSecond } = renderWithExplicitCache(
        <Page />,
        cache
      )

      expect(subscribe).toHaveBeenCalledTimes(1)

      unmountFirst()
      expect(disposers[0]).not.toHaveBeenCalled()

      unmountSecond()
      expect(disposers[0]).toHaveBeenCalledTimes(1)
    })

    // The last unmount disposes exactly once.
    it('disposes exactly once on the last unmount', () => {
      const cache = new Map()
      const swrKey = createKey()
      const { subscribe, disposers } = trackedSubscribe()
      function Page() {
        useSWRSubscription(swrKey, subscribe)
        return null
      }
      const view = renderWithExplicitCache(<Page />, cache)

      view.unmount()

      expect(disposers).toHaveLength(1)
      expect(disposers[0]).toHaveBeenCalledTimes(1)
    })

    // Re-mounting the same key after full teardown must subscribe again with a
    // fresh disposer, proving the stale entry was dropped (this is the leak).
    it('runs a fresh subscribe on re-mount after full teardown', () => {
      const cache = new Map()
      const swrKey = createKey()
      const { subscribe, disposers } = trackedSubscribe()
      function Page() {
        useSWRSubscription(swrKey, subscribe)
        return null
      }

      const { unmount: unmountFirst } = renderWithExplicitCache(<Page />, cache)
      unmountFirst()
      expect(subscribe).toHaveBeenCalledTimes(1)
      expect(disposers[0]).toHaveBeenCalledTimes(1)

      const { unmount: unmountSecond } = renderWithExplicitCache(
        <Page />,
        cache
      )
      // A stale disposer would be reused; a fresh subscribe proves teardown.
      expect(subscribe).toHaveBeenCalledTimes(2)
      expect(disposers).toHaveLength(2)
      expect(disposers[1]).not.toHaveBeenCalled()

      unmountSecond()
      expect(disposers[1]).toHaveBeenCalledTimes(1)
    })

    // Disposal of one key must not touch a different, still-mounted key.
    it('isolates disposal per key', () => {
      const cache = new Map()
      const keyA = createKey()
      const keyB = createKey()
      const { subscribe: subscribeA, disposers: disposersA } =
        trackedSubscribe()
      const { subscribe: subscribeB, disposers: disposersB } =
        trackedSubscribe()
      function PageA() {
        useSWRSubscription(keyA, subscribeA)
        return null
      }
      function PageB() {
        useSWRSubscription(keyB, subscribeB)
        return null
      }
      const { unmount: unmountA } = renderWithExplicitCache(<PageA />, cache)
      renderWithExplicitCache(<PageB />, cache)

      unmountA()

      expect(disposersA[0]).toHaveBeenCalledTimes(1)
      expect(disposersB[0]).not.toHaveBeenCalled()
    })
  })
})
