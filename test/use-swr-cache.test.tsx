import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { useSWRConfig, SWRConfig, mutate as globalMutate } from 'swr'
import { sleep, createKey, nextTick, focusOn } from './utils'

describe('useSWR - cache provider', () => {
  let provider

  beforeEach(() => {
    provider = new Map()
  })

  it('should be able to update the cache', async () => {
    const fetcher = _key => 'res:' + _key
    const keys = [createKey(), createKey()]

    function Section() {
      const [index, setIndex] = useState(0)
      const { data } = useSWR(keys[index], fetcher)

      return <div onClick={() => setIndex(1)}>{data}</div>
    }

    function App() {
      return (
        <SWRConfig value={{ provider: () => provider }}>
          <Section />
        </SWRConfig>
      )
    }

    const { container } = render(<App />)
    await screen.findByText(fetcher(keys[0]))

    expect(provider.get(keys[1])).toBe(undefined)
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(10))

    expect(provider.get(keys[0])).toBe(fetcher(keys[0]))
    expect(provider.get(keys[1])).toBe(fetcher(keys[1]))
  })

  it('should be able to read from the initial cache with updates', async () => {
    const key = createKey()
    const renderedValues = []
    const fetcher = () =>
      new Promise(res => setTimeout(res, 100, 'updated value'))

    function Page() {
      const { data } = useSWR(key, fetcher)
      renderedValues.push(data)
      return <div>{data}</div>
    }

    function App() {
      return (
        <SWRConfig value={{ provider: () => new Map([[key, 'cached value']]) }}>
          <Page />
        </SWRConfig>
      )
    }

    render(<App />)
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

    function App() {
      return (
        <SWRConfig value={{ provider: () => new Map([[key, 'cached value']]) }}>
          <Page />
        </SWRConfig>
      )
    }

    render(<App />)
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
          <SWRConfig value={{ provider: () => new Map([[key, '2']]) }}>
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    function App() {
      return (
        <SWRConfig value={{ provider: () => new Map([[key, '1']]) }}>
          <Page />
        </SWRConfig>
      )
    }

    render(<App />)
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
          <SWRConfig value={{ provider: () => new Map([[key, '1']]) }}>
            <Foo />
          </SWRConfig>
          :
          <SWRConfig value={{ provider: () => new Map([[key, '2']]) }}>
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    render(<Page />)
    screen.getByText('1:2')
  })

  it('should respect provider options', async () => {
    const key = createKey()
    const focusFn = jest.fn()

    let value = 1
    function Foo() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig
          value={{
            provider: () => new Map([[key, 0]]),
            initFocus() {
              focusFn()
            },
            initReconnect() {
              /* do nothing */
            }
          }}
        >
          <Foo />
        </SWRConfig>
      )
    }
    render(<Page />)
    screen.getByText('0')

    // mount
    await screen.findByText('1')
    await nextTick()
    // try to trigger revalidation, but shouldn't work
    await focusOn(window)
    // revalidateOnFocus won't work
    screen.getByText('1')
    expect(focusFn).toBeCalled()
  })

  it('should work with revalidateOnFocus', async () => {
    const key = createKey()
    let value = 0
    function Foo() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig value={{ provider: () => provider }}>
          <Foo />
        </SWRConfig>
      )
    }
    render(<Page />)
    screen.getByText('undefined')

    await screen.findByText('0')
    await nextTick()
    await focusOn(window)
    screen.getByText('1')
  })

  it('should support fallback values', async () => {
    const key = createKey()
    function Foo() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig
          value={{
            fallbackValues: { [key]: 'fallback' }
          }}
        >
          <Foo />
        </SWRConfig>
      )
    }

    render(<Page />)
    screen.getByText('fallback') // no `undefined`, directly fallback
    await screen.findByText('data')
  })

  it('should support fallback values with custom provider', async () => {
    const key = createKey()
    function Foo() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig
          value={{
            provider: () => provider,
            fallbackValues: { [key]: 'fallback' }
          }}
        >
          <Foo />
        </SWRConfig>
      )
    }

    render(<Page />)
    screen.getByText('fallback') // no `undefined`, directly fallback
    await screen.findByText('data')
  })

  it('should not return the fallback if cached', async () => {
    const key = createKey()
    function Foo() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig
          value={{
            provider: () => new Map([[key, 'cache']]),
            fallbackValues: { [key]: 'fallback' }
          }}
        >
          <Foo />
        </SWRConfig>
      )
    }

    render(<Page />)
    screen.getByText('cache') // no `undefined`, directly from cache
    await screen.findByText('data')
  })

  it('should return the global cache and mutate by default', async () => {
    let localCache, localMutate
    function Page() {
      const { cache, mutate } = useSWRConfig()
      localCache = cache
      localMutate = mutate
      return null
    }

    render(<Page />)
    expect(localCache).toBe(SWRConfig.default.cache)
    expect(localMutate).toBe(globalMutate)
  })

  it('should be able to extend the parent cache', async () => {
    let parentCache

    const key = createKey()
    function Foo() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'data'
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig
          value={{
            provider: parentCache_ => {
              parentCache = parentCache_
              return {
                set: (k, v) => parentCache_.set(k, v),
                get: k => {
                  // We append `-extended` to the value returned by the parent cache.
                  const v = parentCache_.get(k)
                  if (typeof v === 'undefined') return v
                  return v + '-extended'
                },
                delete: k => parentCache_.delete(k)
              }
            }
          }}
        >
          <Foo />
        </SWRConfig>
      )
    }

    render(<Page />)
    expect(parentCache).toBe(SWRConfig.default.cache)

    screen.getByText('undefined')
    await screen.findByText('data-extended')
  })

  it('should return the cache instance from the useSWRConfig', async () => {
    const cache = new Map()
    let cache2
    function Foo() {
      cache2 = useSWRConfig().cache
      return null
    }
    function Page() {
      return (
        <SWRConfig value={{ provider: () => cache }}>
          <Foo />
        </SWRConfig>
      )
    }

    render(<Page />)
    expect(cache).toBe(cache2)
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
          <SWRConfig value={{ fallbackValues: { [key]: 'fallback' } }}>
            <Foo />
          </SWRConfig>
          ,
          <Bar />
        </div>
      )
    }

    render(<Page />)
    screen.getByText('undefined,fallback,undefined')
    await screen.findByText('data,data,data')
  })

  it('should clear cache between tests', async () => {
    expect(provider.size).toBe(0)
  })
})
