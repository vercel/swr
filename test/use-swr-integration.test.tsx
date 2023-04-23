import { act, screen, fireEvent } from '@testing-library/react'
import React, { useState, useEffect, Profiler } from 'react'
import useSWR from 'swr'
import {
  createResponse,
  sleep,
  nextTick as waitForNextTick,
  renderWithConfig,
  createKey,
  renderWithGlobalCache
} from './utils'

describe('useSWR', () => {
  const sharedKey = createKey()
  it('should return `undefined` on hydration then return data', async () => {
    function Page() {
      const { data } = useSWR(sharedKey, () => 'SWR')
      return <div>hello, {data}</div>
    }

    renderWithGlobalCache(<Page />)
    // hydration
    screen.getByText('hello,')

    // mounted
    await screen.findByText('hello, SWR')
  })

  it('should allow functions as key and reuse the cache', async () => {
    function Page() {
      const { data } = useSWR(
        () => sharedKey,
        () => 'SWR'
      )
      return <div>hello, {data}</div>
    }

    renderWithGlobalCache(<Page />)
    screen.getByText('hello, SWR')
  })

  it('should allow async fetcher functions', async () => {
    const fetcher = jest.fn(() => createResponse('SWR'))
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('hello,')

    await screen.findByText('hello, SWR')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('should not call fetch function when revalidateOnMount is false', async () => {
    const fetch = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, fetch, {
        revalidateOnMount: false
      })
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('hello,')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should call fetch function when revalidateOnMount is false and key has been changed', async () => {
    const fetch = jest.fn(() => 'SWR')

    function Page() {
      const [key, setKey] = useState(createKey())
      const { data } = useSWR(key, fetch, {
        revalidateOnMount: false
      })
      return <div onClick={() => setKey(createKey)}>hello,{data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('hello,')
    expect(fetch).not.toHaveBeenCalled()

    // the key has been changed
    fireEvent.click(screen.getByText('hello,'))

    await screen.findByText('hello,SWR')
  })

  it('should call fetch function when revalidateOnMount is true even if fallbackData is set', async () => {
    const fetch = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, fetch, {
        revalidateOnMount: true,
        fallbackData: 'gab'
      })
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello, gab')

    await screen.findByText('hello, SWR')
    expect(fetch).toHaveBeenCalled()
  })

  it('initial loading state should be false when revalidation is disabled with fallbackData', async () => {
    const fetch = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data, isLoading, isValidating } = useSWR(key, fetch, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        fallbackData: 'Fallback'
      })
      return (
        <div>
          {data}, {isLoading.toString()} , {isValidating.toString()}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('Fallback, false , false')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should dedupe requests by default', async () => {
    const fetcher = jest.fn(() => createResponse('SWR'))

    const key = createKey()
    function Page() {
      const { data: v1 } = useSWR(key, fetcher)
      const { data: v2 } = useSWR(key, fetcher)
      return (
        <div>
          {v1}, {v2}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText(',')

    await screen.findByText('SWR, SWR')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('should trigger the onSuccess event', async () => {
    let SWRData = null
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => createResponse('SWR'), {
        onSuccess: _data => (SWRData = _data)
      })
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,')

    await screen.findByText('hello, SWR')
    expect(SWRData).toEqual('SWR')
  })

  it('should broadcast data', async () => {
    let cnt = 0

    const key = createKey()
    function Block() {
      const { data } = useSWR(key, () => cnt++, {
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

    renderWithConfig(<Page />)

    await act(() => sleep(50))
    screen.getByText('0 0 0')

    await act(() => sleep(100))
    screen.getByText('1 1 1')

    await act(() => sleep(100))
    screen.getByText('2 2 2')
  })

  it('should broadcast error', async () => {
    let cnt = 0

    const key = createKey()
    function Block() {
      const { data, error } = useSWR(
        key,
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

    renderWithConfig(<Page />)

    await act(() => sleep(50))
    screen.getByText('0 0 0')

    await act(() => sleep(100))
    screen.getByText('1 1 1')

    await act(() => sleep(100))
    screen.getByText('err err err')
  })

  it('should broadcast isValidating', async () => {
    const key = createKey()
    function useBroadcast3() {
      const { isValidating, mutate } = useSWR(key, () => sleep(100), {
        // need to turn of deduping otherwise
        // revalidating will be ignored
        dedupingInterval: 10
      })
      return { isValidating, mutate }
    }
    function Initiator() {
      const { isValidating, mutate } = useBroadcast3()
      useEffect(() => {
        const timeout = setTimeout(() => {
          mutate()
        }, 200)
        return () => clearTimeout(timeout)
        // the revalidate function is always the same reference because the key of the useSWR is static (broadcast-3)
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    renderWithConfig(<Page />)
    screen.getByText('true true true')

    await act(() => sleep(150))
    screen.getByText('false false false')

    await act(() => sleep(100))
    screen.getByText('true true true')

    await act(() => sleep(100))
    screen.getByText('false false false')
  })

  it('should accept object args', async () => {
    const obj = { v: 'hello' }
    const arr = ['world']

    const key1 = createKey()
    const key2 = createKey()
    function Page() {
      const { data: v1 } = useSWR(
        [key1, obj, arr],
        ([a, b, c]) => a + b.v + c[0]
      )

      // reuse the cache
      const { data: v2 } = useSWR([key1, obj, arr], () => 'not called!')

      // different object
      const { data: v3 } = useSWR(
        [key2, obj, 'world'],
        ([a, b, c]) => a + b.v + c
      )

      return (
        <div>
          {v1}, {v2}, {v3}
        </div>
      )
    }

    renderWithConfig(<Page />)

    await screen.findByText(
      `${key1}helloworld, ${key1}helloworld, ${key2}helloworld`
    )
  })

  it('should accept function returning args', async () => {
    const obj = { v: 'hello' }
    const arr = ['world']

    const key = createKey()
    function Page() {
      const { data } = useSWR(
        () => [key, obj, arr],
        ([a, b, c]) => a + b.v + c[0]
      )

      return <div>{data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText(`${key}helloworld`)
  })

  it('should accept initial data', async () => {
    const fetcher = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, fetcher, {
        fallbackData: 'Initial'
      })
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('hello, Initial')
    expect(fetcher).not.toBeCalled()
  })

  it('should revalidate even if fallbackData is provided', async () => {
    const fetcher = key => createResponse(key, { delay: 50 })

    const initialKey = createKey()
    const updatedKey = createKey()
    function Page() {
      const [key, setKey] = useState(initialKey)
      const { data } = useSWR(key, fetcher, {
        fallbackData: 'Initial'
      })
      return (
        <div onClick={() => setKey(updatedKey)}>
          {data ? `hello, ${data}` : 'loading'}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // render with the initial data
    await screen.findByText('hello, Initial')

    await waitForNextTick()
    fireEvent.focus(window)

    await screen.findByText(`hello, ${initialKey}`)

    // change the key
    await waitForNextTick()
    fireEvent.click(screen.getByText(`hello, ${initialKey}`))

    // a request is still in flight
    await act(() => sleep(10))
    // while validating, SWR returns the fallbackData
    // https://github.com/vercel/swr/pull/961/files#r588928241
    screen.getByText('hello, Initial')

    // render with data the fetcher returns
    await screen.findByText(`hello, ${updatedKey}`)
  })

  it('should set config as second parameter', async () => {
    const fetcher = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, {
        fetcher
      })

      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,')
    expect(fetcher).toBeCalled()
    await screen.findByText('hello, SWR')
  })

  it('should revalidate on mount after dedupingInterval', async () => {
    const key = createKey()
    let cnt = 0

    function Foo() {
      const { data } = useSWR(key, () => 'data: ' + cnt++, {
        dedupingInterval: 0
      })
      return <>{data}</>
    }

    function Page() {
      const [showFoo, setShowFoo] = React.useState(true)
      return (
        <>
          {showFoo ? <Foo /> : null}
          <button onClick={() => setShowFoo(!showFoo)}>toggle</button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await waitForNextTick()
    screen.getByText('data: 0')
    fireEvent.click(screen.getByText('toggle'))
    await waitForNextTick()
    fireEvent.click(screen.getByText('toggle'))
    await act(() => sleep(20))
    screen.getByText('data: 1')
  })

  it('Nested SWR hook should only do loading once', async () => {
    const key = createKey()
    let count = 0
    const ChildComponent = () => {
      const { data } = useSWR(key, _ => createResponse(_, { delay: 100 }))
      return <div id="child">{data}</div>
    }
    const NestedRender = () => {
      const { data, isValidating } = useSWR(key, _ =>
        createResponse(_, { delay: 50 })
      )
      if (isValidating) {
        return <div>loading</div>
      }
      return (
        <div>
          <div id="parent">{data}</div>
          <ChildComponent />
        </div>
      )
    }
    const Page = () => (
      <Profiler
        id={key}
        onRender={() => {
          count += 1
        }}
      >
        <NestedRender />
      </Profiler>
    )
    renderWithConfig(<Page />)
    await screen.findByText(`loading`)
    await screen.findAllByText(key)
    await act(() => sleep(150))
    expect(count).toBe(2)
  })

  // Test for https://swr.vercel.app/docs/advanced/performance#dependency-collection
  it('should render four times in the worst case', async () => {
    let isFirstFetch = true
    const fetcher = async () => {
      if (isFirstFetch) {
        isFirstFetch = false
        throw new Error('error')
      }
      return 'value'
    }
    const key = createKey()

    const logs = []

    function Page() {
      const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
        errorRetryInterval: 10
      })
      logs.push({
        data,
        error,
        isLoading,
        isValidating
      })
      if (isLoading) return <p>loading</p>
      return <p>data:{data}</p>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:value')

    expect(logs).toMatchInlineSnapshot(`
      [
        {
          "data": undefined,
          "error": undefined,
          "isLoading": true,
          "isValidating": true,
        },
        {
          "data": undefined,
          "error": [Error: error],
          "isLoading": false,
          "isValidating": false,
        },
        {
          "data": undefined,
          "error": [Error: error],
          "isLoading": true,
          "isValidating": true,
        },
        {
          "data": "value",
          "error": undefined,
          "isLoading": false,
          "isValidating": false,
        },
      ]
    `)
  })

  // Test for https://swr.vercel.app/docs/advanced/performance#dependency-collection
  it('should render only two times in the best case', async () => {
    let isFirstFetch = true
    const fetcher = async () => {
      if (isFirstFetch) {
        isFirstFetch = false
        throw new Error('error')
      }
      return 'value'
    }
    const key = createKey()

    const logs = []

    function Page() {
      const { data } = useSWR(key, fetcher, {
        errorRetryInterval: 10
      })
      logs.push({ data })
      if (!data) return <p>loading</p>
      return <p>data:{data}</p>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:value')

    expect(logs).toMatchInlineSnapshot(`
      [
        {
          "data": undefined,
        },
        {
          "data": "value",
        },
      ]
    `)
  })

  // Test for https://github.com/vercel/swr/issues/2446
  it('should return latest data synchronously after accessing getter', async () => {
    const fetcher = async () => {
      await sleep(10)
      return 'value'
    }
    const key = createKey()

    const logs = []

    function Page() {
      const swr = useSWR(key, fetcher)
      const [show, setShow] = useState(false)
      useEffect(() => {
        setTimeout(() => {
          setShow(true)
        }, 100)
      }, [])
      if (!show) return null
      logs.push(swr.data)
      return <p>data:{swr.data}</p>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:value')
    expect(logs).toMatchInlineSnapshot(`
      [
        "value",
      ]
    `)
  })
})
