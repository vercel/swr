import { act, fireEvent, screen } from '@testing-library/react'
import React, { Suspense, useEffect, useState } from 'react'
import useSWR, { preload, useSWRConfig } from 'swr'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWR - preload', () => {
  it('preload the fetcher function', async () => {
    const key = createKey()
    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    expect(count).toBe(1)

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('should avoid preloading the resource multiple times', async () => {
    const key = createKey()
    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    preload(key, fetcher)
    preload(key, fetcher)
    expect(count).toBe(1)

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('should be able to prealod resources in effects', async () => {
    const key = createKey()
    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    function Comp() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    function Page() {
      const [show, setShow] = useState(false)
      useEffect(() => {
        preload(key, fetcher)
      }, [])
      return show ? (
        <Comp />
      ) : (
        <button onClick={() => setShow(true)}>click</button>
      )
    }

    renderWithConfig(<Page />)
    expect(count).toBe(1)

    fireEvent.click(screen.getByText('click'))

    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('preload the fetcher function with the suspense mode', async () => {
    const key = createKey()
    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    function Page() {
      const { data } = useSWR(key, fetcher, { suspense: true })
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    expect(count).toBe(1)

    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('avoid suspense waterfall by prefetching the resources', async () => {
    const key1 = createKey()
    const key2 = createKey()

    const response1 = createResponse('foo', { delay: 50 })
    const response2 = createResponse('bar', { delay: 50 })

    const fetcher1 = () => response1
    const fetcher2 = () => response2

    function Page() {
      const { data: data1 } = useSWR(key1, fetcher1, { suspense: true })
      const { data: data2 } = useSWR(key2, fetcher2, { suspense: true })

      return (
        <div>
          data:{data1}:{data2}
        </div>
      )
    }

    preload(key1, fetcher1)
    preload(key2, fetcher2)

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
    let count = 0

    const fetcher = () => {
      ++count
      const res = count === 1 ? new Error('err') : 'foo'
      return createResponse(res)
    }

    let mutate
    function Page() {
      mutate = useSWRConfig().mutate
      const { data, error } = useSWR<any>(key, fetcher)
      if (error) {
        return <div>error:{error.message}</div>
      }
      return <div>data:{data}</div>
    }

    try {
      // error
      await preload(key, fetcher)
    } catch (e) {
      // noop
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    // use the preloaded result
    await screen.findByText('error:err')
    expect(count).toBe(1)

    // revalidate
    await act(() => mutate(key))
    // should not use the preload data
    await screen.findByText('data:foo')
  })

  it('dedupe requests during preloading', async () => {
    const key = createKey()

    let fetcherCount = 0
    let renderCount = 0

    const fetcher = () => {
      ++fetcherCount
      return createResponse('foo', { delay: 50 })
    }

    function Page() {
      ++renderCount
      const { data } = useSWR(key, fetcher, { dedupingInterval: 0 })
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    expect(fetcherCount).toBe(1)

    const { rerender } = renderWithConfig(<Page />)
    expect(renderCount).toBe(1)
    // rerender when the preloading is in-flight, and the deduping interval is over
    await act(() => sleep(10))
    rerender(<Page />)
    expect(renderCount).toBe(2)

    await screen.findByText('data:foo')
    expect(fetcherCount).toBe(1)
    expect(renderCount).toBe(3)
  })
})
