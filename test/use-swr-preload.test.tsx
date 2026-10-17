import { fireEvent, screen } from '@testing-library/react'
import { Suspense, useEffect, useState, Profiler, act } from 'react'
import useSWR, { preload, mutate as globalMutate, useSWRConfig } from 'swr'
import {
  createKey,
  createResponse,
  itShouldSkipForReactCanary,
  renderWithGlobalCache,
  sleep
} from './utils'

describe('useSWR - preload', () => {
  it('preload the fetcher function', async () => {
    const key = createKey()

    const fetcher = jest.fn(() => createResponse('foo'))

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    renderWithGlobalCache(<Page />)
    await screen.findByText('data:foo')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should avoid preloading the resource multiple times', async () => {
    const key = createKey()
    const fetcher = jest.fn(() => createResponse('foo'))

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    preload(key, fetcher)
    preload(key, fetcher)
    preload(key, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    renderWithGlobalCache(<Page />)
    await screen.findByText('data:foo')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should be able to prealod resources in effects', async () => {
    const key = createKey()
    const fetcher = jest.fn(() => createResponse('foo'))

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

    renderWithGlobalCache(<Page />)
    expect(fetcher).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('click'))

    await screen.findByText('data:foo')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  itShouldSkipForReactCanary(
    'preload the fetcher function with the suspense mode',
    async () => {
      const key = createKey()
      const fetcher = jest.fn(() => createResponse('foo'))
      const onRender = jest.fn()
      function Page() {
        const { data } = useSWR(key, fetcher, { suspense: true })
        return <div>data:{data}</div>
      }

      preload(key, fetcher)
      expect(fetcher).toHaveBeenCalledTimes(1)

      renderWithGlobalCache(
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
      expect(onRender).toHaveBeenCalledTimes(1)
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  )

  itShouldSkipForReactCanary(
    'avoid suspense waterfall by prefetching the resources',
    async () => {
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

      renderWithGlobalCache(
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      )
      screen.getByText('loading')
      // Should avoid waterfall(50ms + 50ms)
      await act(() => sleep(80))
      screen.getByText('data:foo:bar')
    }
  )

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

    renderWithGlobalCache(<Page />)
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

    const fetcher = jest.fn(() =>
      createResponse('foo', {
        delay: 50
      })
    )
    const onRender = jest.fn()

    function Page() {
      const { data } = useSWR(key, fetcher, { dedupingInterval: 0 })
      return (
        <Profiler id={key} onRender={onRender}>
          data:{data}
        </Profiler>
      )
    }

    preload(key, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    const { rerender } = renderWithGlobalCache(<Page />)
    expect(onRender).toHaveBeenCalledTimes(1)
    // rerender when the preloading is in-flight, and the deduping interval is over
    await act(() => sleep(10))
    rerender(<Page />)
    expect(onRender).toHaveBeenCalledTimes(2)

    await screen.findByText('data:foo')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(onRender).toHaveBeenCalledTimes(3)
  })

  it('should pass serialize key to fetcher', async () => {
    const key = createKey()
    let calledWith: string

    const fetcher = (args: string) => {
      calledWith = args
    }

    preload(() => key, fetcher)
    expect(calledWith).toBe(key)
  })

  it('wildcard mutate clears an unconsumed preload entry', async () => {
    const key = createKey()
    const preloadFetcher = jest.fn(() => createResponse('preloaded'))
    const newFetcher = jest.fn(() => createResponse('fresh'))

    function Page() {
      const { data } = useSWR(key, newFetcher)
      return <div>data:{data}</div>
    }

    // Preloaded but never consumed by a useSWR mount, so it lives only in PRELOAD.
    preload(key, preloadFetcher)
    expect(preloadFetcher).toHaveBeenCalledTimes(1)

    // Wildcard mutate should clear the unconsumed preload entry.
    await globalMutate(() => true, undefined, { revalidate: false })

    renderWithGlobalCache(<Page />)
    // The value must come from newFetcher, not the stale preloaded promise.
    await screen.findByText('data:fresh')
    expect(newFetcher).toHaveBeenCalledTimes(1)
  })

  it('wildcard mutate clears only matching preload entries', async () => {
    const key1 = createKey()
    const key2 = createKey()
    const newFetcher1 = jest.fn(() => createResponse('fresh1'))
    const newFetcher2 = jest.fn(() => createResponse('fresh2'))

    preload(key1, () => createResponse('preloaded1'))
    preload(key2, () => createResponse('preloaded2'))

    // Only clear key1's preload entry.
    await globalMutate(k => k === key1, undefined, { revalidate: false })

    function Page1() {
      const { data } = useSWR(key1, newFetcher1)
      return <div>one:{data}</div>
    }
    function Page2() {
      const { data } = useSWR(key2, newFetcher2)
      return <div>two:{data}</div>
    }

    renderWithGlobalCache(
      <>
        <Page1 />
        <Page2 />
      </>
    )

    // key1: preload cleared -> newFetcher1 runs.
    await screen.findByText('one:fresh1')
    // key2: preload intact -> its preloaded value is used, newFetcher2 never runs.
    await screen.findByText('two:preloaded2')
    expect(newFetcher1).toHaveBeenCalledTimes(1)
    expect(newFetcher2).not.toHaveBeenCalled()
  })

  it('wildcard mutate clears an unconsumed preload with an array key', async () => {
    const key = createKey()
    const arrayKey = [key, 1]
    const preloadFetcher = jest.fn(() => createResponse('preloaded'))
    const newFetcher = jest.fn(() => createResponse('fresh'))

    function Page() {
      const { data } = useSWR(arrayKey, newFetcher)
      return <div>data:{data}</div>
    }

    preload(arrayKey, preloadFetcher)
    expect(preloadFetcher).toHaveBeenCalledTimes(1)

    // A structural filter must match the array key by its original args, not
    // the serialized string that PRELOAD is keyed by.
    await globalMutate(k => Array.isArray(k) && k[0] === key, undefined, {
      revalidate: false
    })

    renderWithGlobalCache(<Page />)
    await screen.findByText('data:fresh')
    expect(newFetcher).toHaveBeenCalledTimes(1)
  })

  it('wildcard mutate still revalidates a consumed preload as before', async () => {
    const key = createKey()
    let count = 0
    const fetcher = jest.fn(() => createResponse(`v${++count}`))

    function Page() {
      const { data } = useSWR(key, fetcher, { dedupingInterval: 0 })
      return <div>data:{data}</div>
    }

    preload(key, fetcher) // count -> 1
    renderWithGlobalCache(<Page />) // consumes preload, deletes PRELOAD[key]
    await screen.findByText('data:v1')

    // Wildcard mutate with revalidation refetches normally.
    await act(() => globalMutate(() => true))
    await screen.findByText('data:v2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
