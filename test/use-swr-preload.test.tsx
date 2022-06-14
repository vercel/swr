import { screen, act } from '@testing-library/react'
import React, { Suspense } from 'react'
import useSWR, { preload, useSWRConfig } from 'swr'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWR - preload', () => {
  it('should be able to preload the fetcher function', async () => {
    const key = createKey()

    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    preload(key, fetcher)

    expect(count).toBe(1)

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('should be able to preload the fetcher function with the suspense mode', async () => {
    const key = createKey()

    let count = 0

    const fetcher = () => {
      ++count
      return createResponse('foo')
    }

    preload(key, fetcher)

    expect(count).toBe(1)

    function Page() {
      const { data } = useSWR(key, fetcher, { suspense: true })
      return <div>data:{data}</div>
    }

    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    await screen.findByText('data:foo')
    expect(count).toBe(1)
  })

  it('should be able to avoid suspense waterfall by prefetching the resources', async () => {
    const key1 = createKey()
    const key2 = createKey()

    const response1 = createResponse('foo', { delay: 50 })
    const response2 = createResponse('bar', { delay: 50 })

    const fetcher1 = () => response1
    const fetcher2 = () => response2

    preload(key1, fetcher1)
    preload(key2, fetcher2)

    function Page() {
      const { data: data1 } = useSWR(key1, fetcher1, { suspense: true })
      const { data: data2 } = useSWR(key2, fetcher2, { suspense: true })

      return (
        <div>
          data:{data1}:{data2}
        </div>
      )
    }

    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    screen.getByText('loading')
    // Should avoid waterfall(50ms + 50ms)
    await sleep(70)
    screen.getByText('data:foo:bar')
  })

  it('should reset the preload result when the preload function gets an error', async () => {
    const key = createKey()

    let count = 0
    const fetcher = () => {
      ++count
      const res = count === 1 ? new Error('err') : 'foo'
      return createResponse(res)
    }

    try {
      // error
      await preload(key, fetcher)
    } catch (_) {
      // noop
    }

    let mutate
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR<any>(key, fetcher)
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:')
    await act(() => mutate(key))
    // re-fetch
    await screen.findByText('data:foo')
  })
})
