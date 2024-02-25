import { act, fireEvent, screen } from '@testing-library/react'
import { sleep, renderWithConfig, createKey } from './utils'
import useSWRSubscription from 'swr/subscription'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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

    // 1 for js-dom 1 for react-error-boundary
    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
