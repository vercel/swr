import { act, fireEvent, screen } from '@testing-library/react'
import React, { useState, StrictMode } from 'react'
import useSWR, { useSWRConfig, SWRConfig, mutate as globalMutate } from 'swr'
import {
  sleep,
  createKey,
  createResponse,
  nextTick,
  focusOn,
  renderWithConfig,
  renderWithGlobalCache
} from './utils'

describe('useSWR - cache provider', () => {
  let provider

  beforeEach(() => {
    provider = new Map()
  })

  it('should be able to update the cache', async () => {
    const fetcher = _key => 'res:' + _key
    const keys = [createKey(), createKey()]

    function Page() {
      const [index, setIndex] = useState(0)
      const { data } = useSWR(keys[index], fetcher)

      return <div onClick={() => setIndex(1)}>{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText(fetcher(keys[0]))

    expect(provider.get(keys[1])?.data).toBe(undefined)
    fireEvent.click(screen.getByText(fetcher(keys[0])))
    await act(() => sleep(10))

    expect(provider.get(keys[0])?.data).toBe(fetcher(keys[0]))
    expect(provider.get(keys[1])?.data).toBe(fetcher(keys[1]))
  })

  it('should be able to read from the initial cache with updates', async () => {
    const key = createKey()
    const renderedValues = []
    const fetcher = () => createResponse('updated value', { delay: 10 })

    function Page() {
      const { data } = useSWR(key, fetcher)
      renderedValues.push(data)
      return <div>{data}</div>
    }

    renderWithConfig(<Page />, {
      provider: () => new Map([[key, { data: 'cached value' }]])
    })
    screen.getByText('cached value')
    await screen.findByText('updated value')
    expect(renderedValues.length).toBe(2)
  })

  it('should correctly mutate the cached value', async () => {
    const key = createKey()
    let mutate

    function Page() {
      const { mutate: mutateWithCache } = useSWRConfig()
      mutate = mutateWithCache
      const { data } = useSWR(key, null)
      return <div>{data}</div>
    }

    renderWithConfig(<Page />, {
      provider: () => new Map([[key, { data: 'cached value' }]])
    })
    screen.getByText('cached value')
    await act(() => mutate(key, 'mutated value', false))
    await screen.findByText('mutated value')
  })

  it('should support multi-level cache', async () => {
    const key = createKey()

    // Nested components with the same cache key can get different values.
    function Foo() {
      const { data } = useSWR(key, null)
      return <>{data}</>
    }
    function Page() {
      const { data } = useSWR(key, null)
      return (
        <div>
          {data}:
          <SWRConfig
            value={{ provider: () => new Map([[key, { data: '2' }]]) }}
          >
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    renderWithConfig(<Page />, {
      provider: () => new Map([[key, { data: '1' }]])
    })
    screen.getByText('1:2')
  })

  it('should support isolated cache', async () => {
    const key = createKey()

    // Nested components with the same cache key can get different values.
    function Foo() {
      const { data } = useSWR(key, null)
      return <>{data}</>
    }
    function Page() {
      return (
        <div>
          <SWRConfig
            value={{ provider: () => new Map([[key, { data: '1' }]]) }}
          >
            <Foo />
          </SWRConfig>
          :
          <SWRConfig
            value={{ provider: () => new Map([[key, { data: '2' }]]) }}
          >
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('1:2')
  })

  it('should respect provider options', async () => {
    const key = createKey()
    const focusFn = jest.fn()
    const unsubscribeFocusFn = jest.fn()
    const unsubscribeReconnectFn = jest.fn()

    let value = 1
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    const { unmount } = renderWithConfig(<Page />, {
      provider: () => new Map([[key, { data: 0 }]]),
      initFocus() {
        focusFn()
        return unsubscribeFocusFn
      },
      initReconnect() {
        /* do nothing */
        return unsubscribeReconnectFn
      }
    })
    screen.getByText('0')

    // mount
    await screen.findByText('1')
    await nextTick()
    // try to trigger revalidation, but shouldn't work
    await focusOn(window)
    // revalidateOnFocus won't work
    screen.getByText('1')
    unmount()
    expect(focusFn).toBeCalled()
    expect(unsubscribeFocusFn).toBeCalledTimes(1)
    expect(unsubscribeReconnectFn).toBeCalledTimes(1)
  })

  it('should work with revalidateOnFocus', async () => {
    const key = createKey()
    let value = 0
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    screen.getByText('undefined')

    await screen.findByText('0')
    await nextTick()
    await focusOn(window)
    await nextTick()
    screen.getByText('1')
  })

  it('should support fallback values with custom provider', async () => {
    const key = createKey()
    function Page() {
      const { data, isLoading } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return (
        <>
          {String(data)},{String(isLoading)}
        </>
      )
    }

    renderWithConfig(<Page />, {
      provider: () => provider,
      fallback: { [key]: 'fallback' }
    })
    screen.getByText('fallback,true') // no `undefined`, directly fallback
    await screen.findByText('data,false')
  })

  it('should not return the fallback if cached', async () => {
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }

    renderWithConfig(<Page />, {
      provider: () => new Map([[key, { data: 'cache' }]]),
      fallback: { [key]: 'fallback' }
    })
    screen.getByText('cache') // no `undefined`, directly from cache
    await screen.findByText('data')
  })

  it('should be able to extend the parent cache', async () => {
    let parentCache

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }

    renderWithConfig(<Page />, {
      provider: parentCache_ => {
        parentCache = parentCache_
        return {
          set: (k, v) => parentCache_.set(k, v),
          get: k => {
            // We append `-extended` to the value returned by the parent cache.
            const v = parentCache_.get(k)
            if (v && typeof v.data !== 'undefined') {
              return { ...v, data: v.data + '-extended' }
            }
            return v
          },
          keys: () => parentCache_.keys(),
          delete: k => parentCache_.delete(k)
        }
      }
    })
    expect(parentCache).toBe(SWRConfig.default.cache)

    screen.getByText('undefined')
    await screen.findByText('data-extended')
  })

  it('should return the cache instance from the useSWRConfig', async () => {
    let cache
    function Page() {
      cache = useSWRConfig().cache
      return null
    }

    renderWithConfig(<Page />, { provider: () => provider })
    expect(provider).toBe(cache)
  })

  it('should retain the correct cache hierarchy', async () => {
    const key = createKey()
    const fetcher = async () => {
      await sleep(10)
      return 'data'
    }

    function Foo() {
      const { data } = useSWR(key, fetcher)
      return <>{String(data)}</>
    }
    function Bar() {
      const { data } = useSWR(key, fetcher)
      return <>{String(data)}</>
    }
    function Page() {
      const { data } = useSWR(key, fetcher)
      return (
        <div>
          {String(data)},
          <SWRConfig value={{ fallback: { [key]: 'fallback' } }}>
            <Foo />
          </SWRConfig>
          ,
          <Bar />
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('undefined,fallback,undefined')
    await screen.findByText('data,data,data')
  })

  it('should not recreate the cache if rerendering', async () => {
    const createCacheProvider = jest.fn()
    let rerender

    function Page() {
      rerender = useState({})[1]
      return (
        <SWRConfig
          value={{
            provider: () => {
              createCacheProvider()
              return provider
            }
          }}
        />
      )
    }

    renderWithConfig(<Page />)
    expect(createCacheProvider).toBeCalledTimes(1)
    act(() => rerender({}))
    expect(createCacheProvider).toBeCalledTimes(1)
  })
})

describe('useSWR - global cache', () => {
  it('should return the global cache and mutate by default', async () => {
    let localCache, localMutate
    function Page() {
      const { cache, mutate } = useSWRConfig()
      localCache = cache
      localMutate = mutate
      return null
    }

    renderWithGlobalCache(<Page />)
    expect(localCache).toBe(SWRConfig.default.cache)
    expect(localMutate).toBe(globalMutate)
  })

  it('should be able to update the cache', async () => {
    const fetcher = _key => 'res:' + _key
    const keys = [createKey(), createKey()]

    let cache
    function Page() {
      const [index, setIndex] = useState(0)
      cache = useSWRConfig().cache
      const { data } = useSWR(keys[index], fetcher)

      return <div onClick={() => setIndex(1)}>{data}</div>
    }

    renderWithGlobalCache(<Page />)
    await screen.findByText(fetcher(keys[0]))

    expect(cache.get(keys[1])?.data).toBe(undefined)
    fireEvent.click(screen.getByText(fetcher(keys[0])))
    await act(() => sleep(10))

    expect(cache.get(keys[0])?.data).toBe(fetcher(keys[0]))
    expect(cache.get(keys[1])?.data).toBe(fetcher(keys[1]))
  })

  it('should correctly mutate the cached value', async () => {
    const key = createKey()
    let mutate

    function Page() {
      const { mutate: mutateWithCache } = useSWRConfig()
      mutate = mutateWithCache
      const { data } = useSWR(key, null)
      return <div>data:{data}</div>
    }

    renderWithGlobalCache(<Page />)
    screen.getByText('data:')
    await act(() => mutate(key, 'mutated value', false))
    await screen.findByText('data:mutated value')
  })

  it('should work with revalidateOnFocus', async () => {
    const key = createKey()
    let value = 0
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    renderWithGlobalCache(<Page />)
    screen.getByText('undefined')

    await screen.findByText('0')
    await nextTick()
    await focusOn(window)
    await nextTick()
    screen.getByText('1')
  })

  it('should support fallback values', async () => {
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }

    renderWithGlobalCache(<Page />, { fallback: { [key]: 'fallback' } })
    screen.getByText('fallback') // no `undefined`, directly fallback
    await screen.findByText('data')
  })

  it('should reusing the same cache instance after unmounting SWRConfig', async () => {
    let focusEventRegistered = false

    const cacheSingleton = new Map([['key', { data: 'value' }]])
    function Page() {
      return (
        <SWRConfig
          value={{
            provider: () => cacheSingleton,
            initFocus: () => {
              focusEventRegistered = true
              return () => (focusEventRegistered = false)
            }
          }}
        >
          <Comp />
        </SWRConfig>
      )
    }
    function Comp() {
      const { cache } = useSWRConfig()
      return <>{String(cache.get('key')?.data)}</>
    }

    function Wrapper() {
      const [mount, setMountPage] = useState(true)
      return (
        <>
          <button onClick={() => setMountPage(!mount)}>toggle</button>
          {mount ? <Page /> : null}
        </>
      )
    }

    renderWithGlobalCache(<Wrapper />)
    await screen.findByText('value')
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    await screen.findByText('value')

    expect(focusEventRegistered).toEqual(true)
  })

  it('should correctly return the cache instance under strict mode', async () => {
    function Page() {
      // Intentionally do this.
      const [cache] = useState(new Map([['key', { data: 'value' }]]))
      return (
        <SWRConfig value={{ provider: () => cache }}>
          <Comp />
        </SWRConfig>
      )
    }
    function Comp() {
      const { cache } = useSWRConfig()
      return <>{String(cache.get('key')?.data)}</>
    }

    renderWithGlobalCache(
      <StrictMode>
        <Page />
      </StrictMode>
    )
    await screen.findByText('value')
  })
})
