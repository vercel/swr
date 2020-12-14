import {
  act,
  fireEvent,
  render,
  waitForDomChange,
  screen
} from '@testing-library/react'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate, SWRConfig, cache } from '../src'
import Cache from '../src/cache'
import { sleep } from './utils'
class ErrorBoundary extends React.Component<{ fallback: ReactNode }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return {
      hasError: true
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

describe('useSWR', () => {
  it('should return `undefined` on hydration then return data', async () => {
    function Page() {
      const { data } = useSWR('constant-2', () => 'SWR')
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)

    // mounted
    await screen.findByText('hello, SWR')
  })

  it('should allow functions as key and reuse the cache', async () => {
    function Page() {
      const { data } = useSWR(() => 'constant-2', () => 'SWR')
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })

  it('should allow async fetcher functions', async () => {
    const fetcher = jest.fn(
      () => new Promise(res => setTimeout(() => res('SWR'), 200))
    )
    function Page() {
      const { data } = useSWR('constant-3', fetcher)
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)

    await act(() => sleep(210))
    expect(fetcher).toBeCalledTimes(1)
    await screen.findByText('hello, SWR')
  })

  it('should not call fetch function when revalidateOnMount is false', async () => {
    const fetch = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('revalidateOnMount', fetch, {
        revalidateOnMount: false
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)

    await screen.findByText('hello,')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should call fetch function when revalidateOnMount is true even if initialData is set', async () => {
    const fetch = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('revalidateOnMount', fetch, {
        revalidateOnMount: true,
        initialData: 'gab'
      })
      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, gab"`
    )

    await screen.findByText('hello, SWR')
    expect(fetch).toHaveBeenCalled()
  })

  it('should dedupe requests by default', async () => {
    const fetcher = jest.fn(
      () => new Promise(res => setTimeout(() => res('SWR'), 200))
    )

    function Page() {
      const { data: v1 } = useSWR('constant-4', fetcher)
      const { data: v2 } = useSWR('constant-4', fetcher)
      return (
        <div>
          {v1}, {v2}
        </div>
      )
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`", "`)

    await act(() => sleep(210))

    expect(fetcher).toBeCalledTimes(1)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"SWR, SWR"`)
  })

  it('should trigger the onSuccess event', async () => {
    let SWRData = null
    function Page() {
      const { data } = useSWR(
        'constant-5',
        () => new Promise(res => setTimeout(() => res('SWR'), 200)),
        { onSuccess: _data => (SWRData = _data) }
      )
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)

    await act(() => sleep(210))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
    expect(SWRData).toEqual('SWR')
  })

  it('should broadcast data', async () => {
    let cnt = 0

    function Block() {
      const { data } = useSWR('broadcast-1', () => cnt++, {
        refreshInterval: 100,
        // need to turn of deduping otherwise
        // refreshing will be ignored
        dedupingInterval: 10
      })
      return <>{data}</>
    }
    function Page() {
      return (
        <>
          <Block /> <Block /> <Block />
        </>
      )
    }
    const { container } = render(<Page />)
    await act(() => sleep(10))
    expect(container.textContent).toMatchInlineSnapshot(`"0 0 0"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"1 1 1"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"2 2 2"`)
  })

  it('should broadcast error', async () => {
    let cnt = 0

    function Block() {
      const { data, error } = useSWR(
        'broadcast-2',
        () => {
          if (cnt === 2) throw new Error('err')
          return cnt++
        },
        {
          refreshInterval: 100,
          // need to turn of deduping otherwise
          // refreshing will be ignored
          dedupingInterval: 10
        }
      )
      if (error) return error.message
      return <>{data}</>
    }
    function Page() {
      return (
        <>
          <Block /> <Block /> <Block />
        </>
      )
    }
    const { container } = render(<Page />)
    await act(() => sleep(10))
    expect(container.textContent).toMatchInlineSnapshot(`"0 0 0"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"1 1 1"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"err err err"`)
  })

  it('should broadcast isValidating', async () => {
    function useBroadcast3() {
      const { isValidating, revalidate } = useSWR(
        'broadcast-3',
        () => new Promise(res => setTimeout(res, 100)),
        {
          // need to turn of deduping otherwise
          // revalidating will be ignored
          dedupingInterval: 10
        }
      )
      return { isValidating, revalidate }
    }
    function Initiator() {
      const { isValidating, revalidate } = useBroadcast3()
      useEffect(() => {
        const timeout = setTimeout(() => {
          revalidate()
        }, 200)
        return () => clearTimeout(timeout)
      }, [])
      return <>{isValidating ? 'true' : 'false'}</>
    }
    function Consumer() {
      const { isValidating } = useBroadcast3()
      return <>{isValidating ? 'true' : 'false'}</>
    }
    function Page() {
      return (
        <>
          <Initiator /> <Consumer /> <Consumer />
        </>
      )
    }
    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"true true true"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"false false false"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"true true true"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"false false false"`)
  })

  it('should accept object args', async () => {
    const obj = { v: 'hello' }
    const arr = ['world']

    function Page() {
      const { data: v1 } = useSWR(
        ['args-1', obj, arr],
        (a, b, c) => a + b.v + c[0]
      )

      // reuse the cache
      const { data: v2 } = useSWR(['args-1', obj, arr], () => 'not called!')

      // different object
      const { data: v3 } = useSWR(
        ['args-2', obj, 'world'],
        (a, b, c) => a + b.v + c
      )

      return (
        <div>
          {v1}, {v2}, {v3}
        </div>
      )
    }

    render(<Page />)

    await screen.findByText(
      'args-1helloworld, args-1helloworld, args-2helloworld'
    )
  })

  it('should accept function returning args', async () => {
    const obj = { v: 'hello' }
    const arr = ['world']

    function Page() {
      const { data } = useSWR(
        () => ['args-3', obj, arr],
        (a, b, c) => a + b.v + c[0]
      )

      return <div>{data}</div>
    }

    render(<Page />)

    await screen.findByText('args-3helloworld')
  })

  it('should accept initial data', async () => {
    const fetcher = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('initial-data-1', fetcher, {
        initialData: 'Initial'
      })
      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)

    expect(fetcher).not.toBeCalled()
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, Initial"`
    )
  })

  it('should set config as second parameter', async () => {
    const fetcher = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('config-as-second-param', {
        fetcher
      })

      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    expect(fetcher).toBeCalled()

    await screen.findByText('hello, SWR')
  })
})

describe('useSWR - loading', () => {
  const loadData = () => new Promise(res => setTimeout(() => res('data'), 100))

  it('should return loading state', async () => {
    let renderCount = 0
    function Page() {
      const { data, isValidating } = useSWR('is-validating-1', loadData)
      renderCount++
      return (
        <div>
          hello, {data}, {isValidating ? 'loading' : 'ready'}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello, , loading"`)

    await act(() => sleep(110))
    expect(container.textContent).toMatchInlineSnapshot(`"hello, data, ready"`)
    //    data       isValidating
    // -> undefined, false
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(3)
  })

  it('should avoid extra rerenders', async () => {
    let renderCount = 0
    function Page() {
      // we never access `isValidating`, so it will not trigger rerendering
      const { data } = useSWR('is-validating-2', loadData)
      renderCount++
      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)

    await act(() => sleep(110))

    expect(container.textContent).toMatchInlineSnapshot(`"hello, data"`)

    //    data
    // -> undefined
    // -> data
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders while fetching', async () => {
    let renderCount = 0,
      dataLoaded = false
    const loadDataWithLog = () =>
      new Promise(res =>
        setTimeout(() => {
          dataLoaded = true
          res('data')
        }, 100)
      )

    function Page() {
      // we never access anything
      useSWR('is-validating-3', loadDataWithLog)
      renderCount++
      return <div>hello</div>
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello"`)

    await act(() => sleep(110)) // wait
    // it doesn't re-render, but fetch was triggered
    expect(renderCount).toEqual(1)
    expect(dataLoaded).toEqual(true)
  })
})

describe('useSWR - refresh', () => {
  it('should rerender automatically on interval', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-1', () => count++, {
        refreshInterval: 200,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(50)) // no update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(150)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
  })

  it('should dedupe requests combined with intervals', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-2', () => count++, {
        refreshInterval: 200,
        dedupingInterval: 300
      })
      return <div>count: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210)) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => sleep(200)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(200)) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(200)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
  })

  it('should update data upon interval changes', async () => {
    let count = 0
    function Page() {
      const [int, setInt] = React.useState(200)
      const { data } = useSWR('/api', () => count++, {
        refreshInterval: int,
        dedupingInterval: 100
      })
      return (
        <div onClick={() => setInt(num => (num < 400 ? num + 100 : 0))}>
          count: {data}
        </div>
      )
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(50))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(150))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
    fireEvent.click(container.firstElementChild)

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)

    await act(() => sleep(110))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 3"`)

    await act(() => sleep(310))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // it will clear 300ms timer and setup a new 400ms timer
      return sleep(300)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    await act(() => sleep(110))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // it will clear 400ms timer and stop
      return sleep(110)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    await act(() => sleep(110))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
  })

  it('should update data upon interval changes -- changes happened during revalidate', async () => {
    let count = 0
    const STOP_POLLING_THRESHOLD = 2
    function Page() {
      const [flag, setFlag] = useState(0)
      const shouldPoll = flag < STOP_POLLING_THRESHOLD
      const { data } = useSWR(
        '/interval-changes-during-revalidate',
        () => count++,
        {
          refreshInterval: shouldPoll ? 200 : 0,
          dedupingInterval: 100,
          onSuccess() {
            setFlag(value => value + 1)
          }
        }
      )
      return (
        <div onClick={() => setFlag(0)}>
          count: {data} {flag}
        </div>
      )
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count:  0"`
    )

    await screen.findByText('count: 0 1')

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    fireEvent.click(container.firstElementChild)

    await act(() => {
      // it will setup a new 200ms timer
      return sleep(100)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 0"`
    )

    await act(() => sleep(100))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 2 1"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )
  })

  it('should allow use custom isEqual method', async () => {
    let count = 0
    const fetcher = jest.fn(() => ({
      timestamp: ++count,
      version: '1.0'
    }))
    function Page() {
      const { data, mutate: change } = useSWR('dynamic-11', fetcher, {
        compare: function isEqual(a, b) {
          if (a === b) {
            return true
          }
          if (!a || !b) {
            return false
          }
          return a.version === b.version
        }
      })

      if (!data) {
        return <div>loading</div>
      }
      return <button onClick={() => change()}>{data.timestamp}</button>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"loading"`)

    await screen.findByText('1')
    expect(fetcher).toBeCalledTimes(1)
    expect(fetcher).toReturnWith({
      timestamp: 1,
      version: '1.0'
    })

    fireEvent.click(container.firstElementChild)
    await act(() => sleep(1))
    expect(fetcher).toBeCalledTimes(2)
    expect(fetcher).toReturnWith({
      timestamp: 2,
      version: '1.0'
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1"`)
  })
})

describe('useSWR - revalidate', () => {
  it('should rerender after triggering revalidation', async () => {
    let value = 0

    function Page() {
      const { data, revalidate } = useSWR('dynamic-3', () => value++)
      return <button onClick={revalidate}>data: {data}</button>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // trigger revalidation
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should revalidate all the hooks with the same key', async () => {
    let value = 0

    function Page() {
      const { data: v1, revalidate } = useSWR('dynamic-4', () => value++)
      const { data: v2 } = useSWR('dynamic-4', () => value++)
      return (
        <button onClick={revalidate}>
          {v1}, {v2}
        </button>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`", "`)
    // mount
    await screen.findByText('0, 0')

    fireEvent.click(container.firstElementChild)

    await act(() => {
      // trigger revalidation
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1, 1"`)
  })

  it('should respect sequences of revalidation calls (cope with race condition)', async () => {
    let faster = false

    function Page() {
      const { data, revalidate } = useSWR(
        'race',
        () =>
          new Promise(res => {
            const value = faster ? 1 : 0
            setTimeout(() => res(value), faster ? 100 : 200)
          })
      )

      return <button onClick={revalidate}>{data}</button>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`)

    // mount
    await screen.findByText('0')

    // trigger the slower revalidation
    faster = false
    fireEvent.click(container.firstElementChild)
    await sleep(10)
    // trigger the faster revalidation
    faster = true
    fireEvent.click(container.firstElementChild)

    await act(() => sleep(210))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1"`)
  })
})

describe('useSWR - error', () => {
  it('should handle errors', async () => {
    function Page() {
      const { data, error } = useSWR(
        'error-1',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error!')), 200)
          )
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    // mount
    await screen.findByText('error!')
  })

  it('should trigger the onError event', async () => {
    let erroredSWR = null
    function Page() {
      const { data, error } = useSWR(
        'error-2',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error!')), 200)
          ),
        { onError: (_, key) => (erroredSWR = key) }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    // mount
    await screen.findByText('error!')
    expect(erroredSWR).toEqual('error-2')
  })

  it('should trigger error retry', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-3',
        () => {
          return new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error: ' + count++)), 100)
          )
        },
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            setTimeout(() => revalidate(revalidateOpts), 100)
          },
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    // mount
    await screen.findByText('error: 0')
    await act(() => sleep(210)) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 1"`)
    await act(() => sleep(210)) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 2"`)
  })

  it('should trigger the onLoadingSlow and onSuccess event', async () => {
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(
        'error-4',
        () => new Promise(res => setTimeout(() => res('SWR'), 200)),
        {
          onLoadingSlow: key => (loadingSlow = key),
          onSuccess: (_, key) => (success = key),
          loadingTimeout: 100
        }
      )
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    expect(loadingSlow).toEqual(null)
    await act(() => sleep(110)) // slow
    expect(loadingSlow).toEqual('error-4')
    expect(success).toEqual(null)
    await act(() => sleep(100)) // finish
    expect(success).toEqual('error-4')
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })
  it('should trigger limited error retries if errorRetryCount exists', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-5',
        () => {
          return new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error: ' + count++)), 100)
          )
        },
        {
          errorRetryCount: 1,
          errorRetryInterval: 50,
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(210)) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 1"`)
    await act(() => sleep(210)) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 1"`)
  })

  it('should not trigger the onLoadingSlow and onSuccess event after component unmount', async () => {
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(
        'error-6',
        () => new Promise(res => setTimeout(() => res('SWR'), 200)),
        {
          onLoadingSlow: key => {
            loadingSlow = key
          },
          onSuccess: (_, key) => {
            success = key
          },
          loadingTimeout: 100
        }
      )
      return <div>{data}</div>
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    const { container } = render(<App />)

    expect(loadingSlow).toEqual(null)
    expect(success).toEqual(null)

    await act(async () => sleep(10))
    fireEvent.click(container.firstElementChild)
    await act(async () => sleep(200))

    expect(success).toEqual(null)
    expect(loadingSlow).toEqual(null)
  })

  it('should not trigger the onError and onErrorRetry event after component unmount', async () => {
    let retry = null,
      failed = null
    function Page() {
      const { data } = useSWR(
        'error-7',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error!')), 200)
          ),
        {
          onError: (_, key) => {
            failed = key
          },
          onErrorRetry: (_, key) => {
            retry = key
          },
          dedupingInterval: 0
        }
      )
      return <div>{data}</div>
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    const { container } = render(<App />)

    expect(retry).toEqual(null)
    expect(failed).toEqual(null)

    await act(async () => sleep(10))
    fireEvent.click(container.firstElementChild)
    await act(async () => sleep(200))

    expect(retry).toEqual(null)
    expect(failed).toEqual(null)
  })

  it('should not trigger error retries if errorRetryCount is set to 0', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-8',
        () => {
          return new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error: ' + count++)), 100)
          )
        },
        {
          errorRetryCount: 0,
          errorRetryInterval: 50,
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    // mount
    await screen.findByText('error: 0')
    await act(() => sleep(210)) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 0"`)
  })

  it('should not clear error during revalidating until fetcher is finished successfully', async () => {
    const errors = []
    const key = 'error-9'
    function Page() {
      const { error } = useSWR(
        key,
        () => {
          return new Promise((_, rej) => rej(new Error('error')))
        },
        {
          errorRetryCount: 0,
          errorRetryInterval: 0,
          dedupingInterval: 0
        }
      )
      useEffect(() => {
        errors.push(error ? error.message : null)
      }, [error])

      return <div>hello, {error ? error.message : null}</div>
    }

    render(<Page />)

    // mount
    await screen.findByText('hello, error')

    await act(() => {
      return mutate(key, undefined, true)
    })
    // initial -> first error -> mutate -> receive another error
    // error won't be cleared during revalidation
    expect(errors).toEqual([null, 'error', 'error'])
  })
})

describe('useSWR - focus', () => {
  it('should revalidate on focus by default', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-5', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    // mount
    await screen.findByText('data: 0')
    // trigger revalidation
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it("shouldn't revalidate on focus when revalidateOnFocus is false", async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-6', () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus: false
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    // trigger revalidation
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
  })
  it('revalidateOnFocus shoule be stateful', async () => {
    let value = 0

    function Page() {
      const [revalidateOnFocus, toggle] = useState(false)
      const { data } = useSWR('dynamic-revalidateOnFocus', () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus,
        focusThrottleInterval: 0
      })
      return <div onClick={() => toggle(s => !s)}>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    // trigger revalidation
    fireEvent.focus(window)

    await act(() => {
      return sleep(1)
    })
    // data should not change
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)

    // change revalidateOnFocus to true
    fireEvent.click(container.firstElementChild)
    // trigger revalidation
    fireEvent.focus(window)

    await act(() => {
      return sleep(1)
    })
    // data should update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
    // trigger revalidation
    fireEvent.focus(window)

    await act(() => {
      return sleep(1)
    })
    // data should update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 2"`)

    // change revalidateOnFocus to false
    fireEvent.click(container.firstElementChild)
    // trigger revalidation
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })
    // data should not change
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 2"`)
  })

  it('focusThrottleInterval should work', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR(
        'focusThrottleInterval should work',
        () => value++,
        {
          dedupingInterval: 0,
          revalidateOnFocus: true,
          focusThrottleInterval: 200
        }
      )
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    // trigger revalidation
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })
    fireEvent.focus(window)
    await act(() => {
      return sleep(210)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 2"`)
  })

  it('focusThrottleInterval should be stateful', async () => {
    let value = 0

    function Page() {
      const [focusThrottleInterval, setInterval] = useState(200)
      const { data } = useSWR(
        'focusThrottleInterval should be stateful',
        () => value++,
        {
          dedupingInterval: 0,
          revalidateOnFocus: true,
          focusThrottleInterval
        }
      )
      return <div onClick={() => setInterval(s => s + 100)}>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    fireEvent.focus(window)
    await act(() => {
      return sleep(210)
    })
    fireEvent.focus(window)
    await act(() => {
      return sleep(210)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 2"`)
    fireEvent.click(container.firstElementChild)
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })
    fireEvent.focus(window)
    await act(() => {
      return sleep(210)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 3"`)

    await act(() => {
      return sleep(100)
    })
    fireEvent.focus(window)
    await act(() => {
      return sleep(310)
    })
    fireEvent.focus(window)
    await act(() => {
      return sleep(1)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 5"`)
  })
})

describe('useSWR - local mutation', () => {
  it('should trigger revalidation programmatically', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-7', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    // mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-7')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should trigger revalidation programmatically within a dedupingInterval', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-12', () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-12')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-8', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-8', 'mutate')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should dedupe extra requests after mutation', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-13', () => value++, {
        dedupingInterval: 2000
      })
      useSWR('dynamic-13', () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')
    act(() => {
      // mutate and revalidate
      mutate('dynamic-13')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate in async', async () => {
    function Page() {
      const { data } = useSWR(
        'dynamic-9',
        () => new Promise(res => setTimeout(() => res('truth'), 200)),
        { dedupingInterval: 0 }
      )
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: truth')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-9', 'local')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: local"`
    )

    await act(() => sleep(200)) // recovers

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: truth"`
    )
  })

  it('should support async mutation with promise', async () => {
    function Page() {
      const { data } = useSWR('mutate-promise', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    await act(() => {
      // mutate and revalidate
      return mutate(
        'mutate-promise',
        new Promise(res => setTimeout(() => res(999), 100)),
        false
      )
    })
    await act(() => sleep(110))
    expect(container.textContent).toMatchInlineSnapshot(`"data: 999"`)
  })

  it('should support async mutation with async function', async () => {
    function Page() {
      const { data } = useSWR('mutate-async-fn', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    await act(() => {
      // mutate and revalidate
      return mutate(
        'mutate-async-fn',
        async () => new Promise(res => setTimeout(() => res(999), 100)),
        false
      )
    })
    await act(() => sleep(110))

    expect(container.textContent).toMatchInlineSnapshot(`"data: 999"`)
  })

  it('should trigger on mutation without data', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-14', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-14')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should call function as data passing current cached value', async () => {
    // prefill cache with data
    cache.set('dynamic-15', 'cached data')
    const callback = jest.fn()
    await mutate('dynamic-15', callback)
    expect(callback).toHaveBeenCalledWith('cached data')
  })

  it('should call function with undefined if key not cached', async () => {
    const increment = jest.fn(currentValue =>
      currentValue == null ? undefined : currentValue + 1
    )

    await mutate('dynamic-15.1', increment, false)

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment).toHaveBeenLastCalledWith(undefined)
    expect(increment).toHaveLastReturnedWith(undefined)

    cache.set('dynamic-15.1', 42)

    await mutate('dynamic-15.1', increment, false)

    expect(increment).toHaveBeenCalledTimes(2)
    expect(increment).toHaveBeenLastCalledWith(42)
    expect(increment).toHaveLastReturnedWith(43)
  })

  it('should return results of the mutation', async () => {
    // returns the data if promise resolved
    expect(mutate('dynamic-16', Promise.resolve('data'))).resolves.toBe('data')

    // throw the error if promise rejected
    expect(
      mutate('dynamic-16', Promise.reject(new Error('error')))
    ).rejects.toBeInstanceOf(Error)
  })

  it('should get bound mutate from useSWR', async () => {
    function Page() {
      // eslint-disable-next-line no-shadow
      const { data, mutate: boundMutate } = useSWR(
        'dynamic-17',
        () => 'fetched'
      )
      return (
        <div onClick={() => boundMutate('mutated', false)}>data: {data}</div>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: fetched')
    // call bound mutate
    fireEvent.click(container.firstElementChild)
    // expect new updated value (after a tick)
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: mutated"`
    )
  })

  it('should ignore in flight requests when mutating', async () => {
    // set it to 1
    act(() => {
      mutate('mutate-2', 1)
    })

    function Section() {
      const { data } = useSWR(
        'mutate-2',
        () => new Promise(res => setTimeout(() => res(2), 200))
      )
      return <div>{data}</div>
    }

    const { container } = render(<Section />)

    expect(container.textContent).toMatchInlineSnapshot(`"1"`) // directly from cache
    await act(() => sleep(150)) // still suspending
    act(() => {
      mutate('mutate-2', 3)
    }) // set it to 3. this will drop the ongoing request
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
  })

  it('should ignore in flight mutations when calling another async mutate', async () => {
    let value = 'off'
    function Page() {
      const { data } = useSWR(
        'mutate-3',
        () => new Promise(res => setTimeout(() => res(value), 200))
      )

      return <div>{data}</div>
    }

    const { container } = render(<Page />)

    await act(() => sleep(250))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`) // Initial state

    act(() => {
      mutate('mutate-3', 'on', false)
    })

    // Validate local state is now "on"
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"on"`)

    // Simulate toggling "on"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
          new Promise(res =>
            setTimeout(() => {
              value = 'on'
              res('on')
            }, 200)
          ),
          false
        )
      ).resolves.toBe('on')
    })

    act(() => {
      mutate('mutate-3', 'off', false)
    })

    // Validate local state is now "off"
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)

    // Simulate toggling "off"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
          new Promise(res =>
            setTimeout(() => {
              value = 'off'
              res('off')
            }, 400)
          ),
          false
        )
      ).resolves.toBe('off')
    })

    // Wait for toggling "on" promise to resolve, but the "on" mutation is cancelled
    await act(() => sleep(210))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)

    // Wait for toggling "off" promise to resolve
    await act(() => sleep(210))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)
  })

  it('null is stringified when found inside an array', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR([null], () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: 0')
    act(() => {
      // trigger revalidation
      mutate([null])
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should return promise from mutate without data', async () => {
    let value = 0
    function Page() {
      const { data } = useSWR('dynamic-18', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    let promise
    await act(() => {
      promise = mutate('dynamic-18')
      return promise
    })
    expect(promise).toBeInstanceOf(Promise) // mutate returns a promise
    expect(promise).resolves.toBe(1) // the return value should be the new cache
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should update error in cache when mutate failed with error', async () => {
    const value = 0
    const key = 'mutate-4'
    const message = 'mutate-error'
    function Page() {
      const { data, error } = useSWR(key, () => value)
      return <div>{error ? error.message : `data: ${data}`}</div>
    }
    const { container } = render(<Page />)
    //mount
    await screen.findByText('data: 0')
    await act(async () => {
      // mutate error will be thrown, add try catch to avoid crashing
      try {
        await mutate(
          key,
          () => {
            throw new Error(message)
          },
          false
        )
      } catch (e) {
        // do nothing
      }
    })

    const [, , keyErr] = cache.serializeKey(key)
    let cacheError = cache.get(keyErr)
    expect(cacheError.message).toMatchInlineSnapshot(`"${message}"`)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"${message}"`
    )
    // if mutate succeed, error should be cleared
    await act(async () => {
      return mutate(key, value, false)
    })
    cacheError = cache.get(keyErr)
    expect(cacheError).toMatchInlineSnapshot(`undefined`)
  })

  it('should keep the `mutate` function referential equal', async () => {
    const refs = []

    function Section() {
      const [key, setKey] = useState(null)
      const { data, mutate: boundMutate } = useSWR(
        key,
        () => new Promise(res => setTimeout(() => res(1), 10))
      )

      useEffect(() => {
        const timeout = setTimeout(() => setKey('mutate-5'), 100)
        return () => clearTimeout(timeout)
      }, [])

      refs.push(boundMutate)
      return <div>{data}</div>
    }

    render(<Section />)
    await act(() => sleep(120))
    act(() => {
      mutate('mutate-5', 2)
    })
    await act(() => sleep(50))

    // check all `setSize`s are referential equal.
    for (let ref of refs) {
      expect(ref).toEqual(refs[0])
    }
  })

  it('should dedupe synchronous mutations', async () => {
    const mutationRecivedValues = []
    const renderRecivedValues = []

    function Component() {
      const { data, mutate: boundMutate } = useSWR('mutate-6', () => 0)

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
      }, [])

      renderRecivedValues.push(data) // should be 0 -> 2, never render 1 in between
      return null
    }

    render(<Component />)

    await act(() => sleep(50))

    expect(mutationRecivedValues).toEqual([0, 1])
    expect(renderRecivedValues).toEqual([undefined, 0, 2])
  })
})

describe('useSWR - context configs', () => {
  it('should read the config fallback from the context', async () => {
    let value = 0
    const fetcher = () => value++

    function Section() {
      const { data } = useSWR('dynamic-10')
      return <div>data: {data}</div>
    }
    function Page() {
      // config provider
      return (
        <SWRConfig
          value={{ fetcher, refreshInterval: 100, dedupingInterval: 0 }}
        >
          <Section />
        </SWRConfig>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    await act(() => sleep(110)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })
})

describe('useSWR - suspense', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should render fallback', async () => {
    function Section() {
      const { data } = useSWR(
        'suspense-1',
        () => new Promise(res => setTimeout(() => res('SWR'), 100)),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => sleep(110)) // update
    expect(container.textContent).toMatchInlineSnapshot(`"SWR"`)
  })

  it('should render multiple SWR fallbacks', async () => {
    function Section() {
      const { data: v1 } = useSWR<number>(
        'suspense-2',
        () => new Promise(res => setTimeout(() => res(1), 100)),
        {
          suspense: true
        }
      )
      const { data: v2 } = useSWR<number>(
        'suspense-3',
        () => new Promise(res => setTimeout(() => res(2), 100)),
        {
          suspense: true
        }
      )
      return <div>{v1 + v2}</div>
    }
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => new Promise(res => setTimeout(res, 150))) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => new Promise(res => setTimeout(res, 100))) // should recover
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
  })

  it('should work for non-promises', async () => {
    function Section() {
      const { data } = useSWR('suspense-4', () => 'hello', {
        suspense: true
      })
      return <div>{data}</div>
    }
    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('hello')
  })
  it('should throw errors', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    function Section() {
      const { data } = useSWR(
        'suspense-5',
        () =>
          new Promise((_, reject) => setTimeout(() => reject('error'), 100)),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }
    // https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors
    const { container } = render(
      <ErrorBoundary fallback={<div>error boundary</div>}>
        <Suspense fallback={<div>fallback</div>}>
          <Section />
        </Suspense>
      </ErrorBoundary>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => sleep(150)) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"error boundary"`)
    // 1 for js-dom 1 for react-error-boundray
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('should render cached data with error', async () => {
    mutate('suspense-6', 'hello')

    function Section() {
      const { data, error } = useSWR(
        // this value is cached
        'suspense-6',
        () =>
          new Promise((_, reject) => setTimeout(() => reject('error'), 100)),
        {
          suspense: true
        }
      )
      return (
        <div>
          {data}, {error}
        </div>
      )
    }

    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    expect(container.textContent).toMatchInlineSnapshot(`"hello, "`) // directly from cache
    await act(() => sleep(150)) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"hello, error"`) // get error with cache
  })

  it('should pause when key changes', async () => {
    const renderedResults = []
    function Section() {
      const [key, setKey] = useState('suspense-7')
      const { data } = useSWR(
        key,
        k => new Promise(res => setTimeout(() => res(k), 50)),
        {
          suspense: true
        }
      )

      useEffect(() => {
        if (data === 'suspense-7') {
          setKey('suspense-8')
        }
      }, [data])

      if (data !== renderedResults[renderedResults.length - 1]) {
        renderedResults.push(data)
      }

      return <>{data}</>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('suspense-8')
    // fixes https://github.com/zeit/swr/issues/57
    // 'suspense-7' -> undefined -> 'suspense-8'
    expect(renderedResults).toEqual(['suspense-7', 'suspense-8'])
  })

  it('should render initial data if set', async () => {
    const fetcher = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('suspense-9', fetcher, {
        initialData: 'Initial',
        suspense: true
      })
      return <div>hello, {data}</div>
    }

    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Page />
      </Suspense>
    )

    expect(fetcher).not.toBeCalled()
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, Initial"`
    )
  })
})

describe('useSWR - cache', () => {
  it('should not react to direct cache updates but mutate', async () => {
    cache.set('cache-1', 'custom cache message')

    function Page() {
      const { data } = useSWR('cache-1', () => 'random message', {
        suspense: true
      })
      return <div>{data}</div>
    }

    // render using custom cache
    const { queryByText } = render(
      <React.Suspense fallback={null}>
        <Page />
      </React.Suspense>
    )

    // content should come from custom cache
    expect(queryByText('custom cache message')).toMatchInlineSnapshot(`
      <div>
        custom cache message
      </div>
    `)

    // content should be updated with fetcher results
    expect(await screen.findByText('random message')).toMatchInlineSnapshot(`
      <div>
        random message
      </div>
    `)
    const value = 'a different message'
    act(() => {
      cache.set('cache-1', value)
    })
    await act(async () => mutate('cache-1', value, false))

    // content should be updated from new cache value, after mutate without revalidate
    expect(await screen.findByText('a different message'))
      .toMatchInlineSnapshot(`
      <div>
        a different message
      </div>
    `)
    act(() => {
      cache.delete('cache-1')
    })
    await act(() => mutate('cache-1'))

    // content should go back to be the fetched value
    expect(await screen.findByText('random message')).toMatchInlineSnapshot(`
      <div>
        random message
      </div>
    `)
  })

  it('should notify subscribers when a cache item changed', async () => {
    // create new cache instance to don't get affected by other tests
    // updating the normal cache instance
    const tmpCache = new Cache()

    const listener = jest.fn()
    const unsubscribe = tmpCache.subscribe(listener)
    tmpCache.set('cache-2', 'random message')

    expect(listener).toHaveBeenCalled()

    unsubscribe()
    tmpCache.set('cache-2', 'a different message')

    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('useSWR - key', () => {
  it('should respect requests after key has changed', async () => {
    let rerender

    function Page() {
      const [mounted, setMounted] = useState(0)
      const key = `key-1-${mounted ? 'short' : 'long'}`
      const { data } = useSWR(key, async () => {
        if (mounted) {
          await new Promise(res => setTimeout(res, 100))
          return 'short request'
        }
        await new Promise(res => setTimeout(res, 200))
        return 'long request'
      })
      useEffect(() => setMounted(1), [])
      rerender = setMounted

      return <div>{data}</div>
    }

    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`)

    await screen.findByText('short request')

    await act(() => sleep(110)) // wait 100ms until "long request" finishes
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"short request"`
    ) // should be "short request" still

    // manually trigger a re-render from outside
    // this triggers a re-render, and a read access to `swr.data`
    // but the result should still be "short request"
    act(() => rerender(x => x + 1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"short request"`
    )
  })

  it('should render undefined after key has changed', async () => {
    function Page() {
      const [mounted, setMounted] = useState(false)
      const key = `key-${mounted ? '1' : '0'}`
      const { data } = useSWR(key, async k => {
        await new Promise(res => setTimeout(res, 200))
        return k
      })
      useEffect(() => {
        setTimeout(() => setMounted(true), 320)
      }, [])
      return <div>{data}</div>
    }

    //    time     data       key
    // -> 0        undefined, '0'
    // -> 200      0,         '0'
    // -> 320      undefined, '1' <- this state is required; we can't show 0 here
    // -> 520      1,         '1'
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`) // undefined, time=0
    await act(() => sleep(210))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"key-0"`) // 0, time=210
    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`) // undefined, time=410
    await act(() => sleep(140))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"key-1"`) // 1, time=550
  })

  it('should return undefined after key change when fetcher is synchronized', async () => {
    const samples = {
      '1': 'a',
      '2': 'b',
      '3': 'c'
    }

    function Page() {
      const [sampleKey, setKey] = React.useState(1)
      const { data } = useSWR(
        `key-2-${sampleKey}`,
        key => samples[key.replace('key-2-', '')]
      )
      return (
        <div
          onClick={() => {
            setKey(sampleKey + 1)
          }}
        >
          hello, {sampleKey}:{data}
        </div>
      )
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 1:"`
    )

    await screen.findByText('hello, 1:a')

    fireEvent.click(container.firstElementChild)
    // first rerender on key change
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 2:"`
    )
    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 2:b"`
    )
  })

  it('should revalidate if a function key changes identity', async () => {
    const closureFunctions: { [key: string]: () => Promise<string> } = {}

    const closureFactory = id => {
      if (closureFunctions[id]) return closureFunctions[id]
      closureFunctions[id] = () => Promise.resolve(`data-${id}`)
      return closureFunctions[id]
    }

    let updateId

    const fetcher = fn => fn()

    function Page() {
      const [id, setId] = React.useState('first')
      updateId = setId
      const fnWithClosure = closureFactory(id)
      const { data } = useSWR([fnWithClosure], fetcher)

      return <div>{data}</div>
    }

    const { container } = render(<Page />)
    const closureSpy = jest.spyOn(closureFunctions, 'first')

    await screen.findByText('data-first')
    expect(closureSpy).toHaveBeenCalledTimes(1)

    // update, but don't change the id.
    // Function identity should stay the same, and useSWR should not call the function again.
    act(() => updateId('first'))
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data-first"`
    )
    expect(closureSpy).toHaveBeenCalledTimes(1)

    act(() => updateId('second'))
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data-second"`
    )
  })

  it('should cleanup state when key turns to empty', async () => {
    function Page() {
      const [cnt, setCnt] = useState(1)
      const { isValidating } = useSWR(
        cnt === -1 ? '' : `key-empty-${cnt}`,
        () => new Promise(r => setTimeout(r, 1000))
      )

      return (
        <div onClick={() => setCnt(cnt == 2 ? -1 : cnt + 1)}>
          {isValidating ? 'true' : 'false'}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)
    await act(() => {
      fireEvent.click(container.firstElementChild)
      return new Promise(res => setTimeout(res, 10))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)
    await act(() => {
      fireEvent.click(container.firstElementChild)
      return new Promise(res => setTimeout(res, 10))
    })
    await new Promise(r => setTimeout(r, 10))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"false"`)
  })
})

describe('useSWR - config callbacks', () => {
  it('should trigger the onSuccess event with the latest version of the onSuccess callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate } = useSWR(
        'config callbacks - onSuccess',
        () => new Promise(res => setTimeout(() => res(count++), 200)),
        { onSuccess: () => (state = props.text) }
      )
      return (
        <div onClick={revalidate}>
          hello, {data}, {props.text}
        </div>
      )
    }
    const { container, rerender } = render(<Page text={'a'} />)
    // the onSuccess callback does not trigger yet, the state still null.
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await screen.findByText('hello, 0, a')

    expect(state).toEqual('a')

    // props changed, but the onSuccess callback does not trigger yet, `state` is same as before
    rerender(<Page text={'b'} />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 0, b"`
    )
    expect(state).toEqual('a')

    // trigger revalidation, this would re-trigger the onSuccess callback
    fireEvent.click(container.firstElementChild)

    await act(() => sleep(201))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 1, b"`
    )
    // the onSuccess callback should capture the latest `props.text`
    expect(state).toEqual('b')
  })

  it('should trigger the onError event with the latest version of the onError callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate, error } = useSWR(
        'config callbacks - onError',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error(`Error: ${count++}`)), 200)
          ),
        { onError: () => (state = props.text) }
      )
      if (error)
        return (
          <div title={props.text} onClick={revalidate}>
            {error.message}
          </div>
        )
      return (
        <div onClick={revalidate}>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { container, rerender } = render(<Page text="a" />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await waitForDomChange({ container })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 0"`)
    expect(state).toEqual('a')

    // props changed, but the onError callback doese not trigger yet.
    rerender(<Page text="b" />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 0"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('a')
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(210))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 1"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onErrorRetry event with the latest version of the onErrorRetry callback', async () => {
    let state = null
    let count = 0
    function Page(props: { text: string }) {
      const { data, error } = useSWR(
        'config callbacks - onErrorRetry',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error(`Error: ${count++}`)), 200)
          ),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            state = props.text
            setTimeout(() => revalidate(revalidateOpts), 100)
          }
        }
      )
      if (error) return <div title={props.text}>{error.message}</div>
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { container, rerender } = render(<Page text="a" />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await screen.findByText('Error: 0')
    expect(container.firstElementChild.getAttribute('title')).toEqual('a')
    expect(state).toEqual('a')

    // since the onErrorRetry schedule a timer to trigger revalidation, update props.text now
    rerender(<Page text="b" />)
    // not revalidate yet.
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 0"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('a')

    await act(() => sleep(350))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 1"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onLoadingSlow and onSuccess event with the lastest version of the callbacks', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data } = useSWR(
        'config callbacks - onLoadingSlow',
        () => new Promise(res => setTimeout(() => res(count++), 200)),
        {
          onLoadingSlow: () => {
            state = props.text
          },
          onSuccess: () => {
            state = props.text
          },
          loadingTimeout: 100
        }
      )
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { container, rerender } = render(<Page text="a" />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await act(() => sleep(101))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual('a')
    rerender(<Page text="b" />)

    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 0, b"`
    )
    expect(state).toEqual('b')
  })
})
