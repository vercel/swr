import { act, fireEvent, screen } from '@testing-library/react'
import { Suspense, useEffect, useState, Profiler } from 'react'
import { preload } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWRInfinite - preload', () => {
  const getKeyFunction = (key: string) => (index: number) =>
    `page-${index}-${key}`

  it('preloading useSWRInfinite should produce the same result', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)

    const fetcher = jest.fn(() => createResponse('foo'))
    function Page() {
      const { data } = useSWRInfinite(getKey, fetcher)
      return <div>data:{Array.isArray(data) ? 'true' : 'false'}</div>
    }

    preload(getKey(0), fetcher)
    renderWithConfig(<Page />)
    await screen.findByText('data:true')
  })

  it('preload the fetcher function', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)

    const fetcher = jest.fn(() => createResponse('foo'))
    function Page() {
      const { data } = useSWRInfinite(getKey, fetcher)
      return <div>data:{data}</div>
    }

    preload(getKey(0), fetcher)
    expect(fetcher).toBeCalledTimes(1)

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('should avoid preloading the resource multiple times', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)
    const fetcher = jest.fn(() => createResponse('foo'))

    function Page() {
      const { data } = useSWRInfinite(getKey, fetcher)
      return <div>data:{data}</div>
    }

    preload(getKey(0), fetcher)
    preload(getKey(0), fetcher)
    preload(getKey(0), fetcher)
    expect(fetcher).toBeCalledTimes(1)

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('should be able to prealod resources in effects', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)
    const fetcher = jest.fn(() => createResponse('foo'))

    function Comp() {
      const { data } = useSWRInfinite(getKey, fetcher)
      return <div>data:{data}</div>
    }

    function Page() {
      const [show, setShow] = useState(false)
      useEffect(() => {
        preload(getKey(0), fetcher)
      }, [])
      return show ? (
        <Comp />
      ) : (
        <button onClick={() => setShow(true)}>click</button>
      )
    }

    renderWithConfig(<Page />)
    expect(fetcher).toBeCalledTimes(1)

    fireEvent.click(screen.getByText('click'))

    await screen.findByText('data:foo')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('preload the fetcher function with the suspense mode', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)
    const fetcher = jest.fn(() => createResponse('foo'))
    const onRender = jest.fn()
    function Page() {
      const { data } = useSWRInfinite(getKey, fetcher, { suspense: true })
      return <div>data:{data}</div>
    }

    preload(getKey(0), fetcher)
    expect(fetcher).toBeCalledTimes(1)

    renderWithConfig(
      <Suspense
        fallback={
          <Profiler id={key} onRender={onRender}>
            loading
          </Profiler>
        }
      >
        <Page />
      </Suspense>
    )
    await screen.findByText('data:foo')
    expect(onRender).toBeCalledTimes(1)
    expect(fetcher).toBeCalledTimes(1)
  })

  it('avoid suspense waterfall by prefetching the resources', async () => {
    const key1 = createKey()
    const getKey1 = getKeyFunction(key1)
    const key2 = createKey()
    const getKey2 = getKeyFunction(key2)

    const response1 = createResponse('foo', { delay: 50 })
    const response2 = createResponse('bar', { delay: 50 })

    const fetcher1 = () => response1
    const fetcher2 = () => response2

    function Page() {
      const { data: data1 } = useSWRInfinite(getKey1, fetcher1, {
        suspense: true
      })
      const { data: data2 } = useSWRInfinite(getKey2, fetcher2, {
        suspense: true
      })

      return (
        <div>
          data:{data1}:{data2}
        </div>
      )
    }

    preload(getKey1(0), fetcher1)
    preload(getKey1(0), fetcher2)

    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    screen.getByText('loading')
    // Should avoid waterfall(50ms + 50ms)
    await act(() => sleep(80))
    screen.getByText('data:foo:bar')
  })

  it('reset the preload result when the preload function gets an error', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)
    let count = 0

    const fetcher = () => {
      ++count
      const res = count === 1 ? new Error('err') : 'foo'
      return createResponse(res)
    }

    let mutate
    function Page() {
      const { data, error, ...swr } = useSWRInfinite<any>(getKey, fetcher)
      mutate = swr.mutate

      if (error) {
        return <div>error:{error.message}</div>
      }
      return <div>data:{data}</div>
    }

    try {
      // error
      await preload(getKey(0), fetcher)
    } catch (e) {
      // noop
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    // use the preloaded result
    await screen.findByText('error:err')
    expect(count).toBe(1)

    // revalidate
    await act(() => mutate(getKey(0)))
    // should not use the preload data
    await screen.findByText('data:foo')
  })

  it('dedupe requests during preloading', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)

    const fetcher = jest.fn(() =>
      createResponse('foo', {
        delay: 50
      })
    )
    const onRender = jest.fn()

    function Page() {
      const { data } = useSWRInfinite(getKey, fetcher, { dedupingInterval: 0 })
      return (
        <Profiler id={key} onRender={onRender}>
          data:{data}
        </Profiler>
      )
    }

    preload(getKey(0), fetcher)
    expect(fetcher).toBeCalledTimes(1)

    const { rerender } = renderWithConfig(<Page />)
    expect(onRender).toBeCalledTimes(1)
    // rerender when the preloading is in-flight, and the deduping interval is over
    await act(() => sleep(10))
    rerender(<Page />)
    expect(onRender).toBeCalledTimes(2)

    await screen.findByText('data:foo')
    expect(fetcher).toBeCalledTimes(1)
    expect(onRender).toBeCalledTimes(3)
  })

  it('should pass serialize key to fetcher', async () => {
    const key = createKey()
    const getKey = getKeyFunction(key)
    let calledWith: string

    const fetcher = (args: string) => {
      calledWith = args
    }

    preload(() => getKey(0), fetcher)
    expect(calledWith).toBe(getKey(0))
  })
  it('should not break parallel option', async () => {
    // mock api
    const pageData = ['apple', 'banana', 'pineapple']

    const key = createKey()
    const fetcher = ([_, index]) =>
      createResponse(`${pageData[index]}, `, { delay: index === 0 ? 50 : 200 })
    function Page() {
      const { data } = useSWRInfinite(index => [key, index], fetcher, {
        initialSize: 3,
        parallel: true
      })

      return <div>data:{data}</div>
    }
    preload([key, 0], fetcher)
    renderWithConfig(<Page />)
    screen.getByText('data:')
    // If SWR sends parallel requests, it should only take 200ms
    await act(() => sleep(200))
    screen.getByText('data:apple, banana, pineapple,')
  })
  it('should be able to preload multiple page', async () => {
    // mock api
    const pageData = ['apple', 'banana', 'pineapple']

    const key = createKey()
    const fetcher = ([_, index]) =>
      createResponse(`${pageData[index]}, `, { delay: 50 })
    function Page() {
      const { data } = useSWRInfinite(index => [key, index], fetcher, {
        initialSize: 3,
        parallel: true
      })

      return <div>data:{data}</div>
    }
    preload([key, 0], fetcher)
    preload([key, 1], fetcher)
    preload([key, 2], fetcher)
    renderWithConfig(<Page />)
    screen.getByText('data:')
    await act(() => sleep(50))
    screen.getByText('data:apple, banana, pineapple,')
  })
})
