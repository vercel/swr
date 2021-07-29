import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { createCache, SWRConfig } from 'swr'
import { sleep, createKey, nextTick, focusOn } from './utils'

describe('useSWR - cache', () => {
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

    const { cache } = createCache(provider)
    const { container } = render(
      <SWRConfig value={{ cache }}>
        <Section />
      </SWRConfig>
    )
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

    provider = new Map([[key, 'cached value']])
    const { cache } = createCache(provider)
    render(
      <SWRConfig value={{ cache }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('cached value')
    await screen.findByText('updated value')
    expect(renderedValues.length).toBe(2)
  })

  it('should correctly mutate the cached value', async () => {
    const key = createKey()

    function Page() {
      const { data } = useSWR(key, null)
      return <div>{data}</div>
    }

    provider = new Map([[key, 'cached value']])
    const { cache, mutate } = createCache(provider)
    render(
      <SWRConfig value={{ cache }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('cached value')
    await act(() => mutate(key, 'mutated value', false))
    await screen.findByText('mutated value')
  })

  it('should support multi-level cache', async () => {
    const key = createKey()
    const provider1 = new Map([[key, '1']])
    const { cache: cache1 } = createCache(provider1)
    const provider2 = new Map([[key, '2']])
    const { cache: cache2 } = createCache(provider2)

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
          <SWRConfig value={{ cache: cache2 }}>
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    render(
      <SWRConfig value={{ cache: cache1 }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('1:2')
  })

  it('should support isolated cache', async () => {
    const key = createKey()
    const provider1 = new Map([[key, '1']])
    const { cache: cache1 } = createCache(provider1)
    const provider2 = new Map([[key, '2']])
    const { cache: cache2 } = createCache(provider2)

    // Nested components with the same cache key can get different values.
    function Foo() {
      const { data } = useSWR(key, null)
      return <>{data}</>
    }
    function Page() {
      return (
        <div>
          <SWRConfig value={{ cache: cache1 }}>
            <Foo />
          </SWRConfig>
          :
          <SWRConfig value={{ cache: cache2 }}>
            <Foo />
          </SWRConfig>
        </div>
      )
    }

    render(<Page />)
    screen.getByText('1:2')
  })

  it('should honor createCache provider options', async () => {
    const key = createKey()
    provider = new Map([[key, 0]])
    const { cache } = createCache(provider, {
      setupOnFocus() {
        /* do nothing */
      },
      setupOnReconnect() {
        /* do nothing */
      }
    })
    let value = 1
    function Foo() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig value={{ cache }}>
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
  })

  it('should work with revalidateOnFocus', async () => {
    const key = createKey()
    const { cache } = createCache(provider)
    let value = 0
    function Foo() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <>{String(data)}</>
    }
    function Page() {
      return (
        <SWRConfig value={{ cache }}>
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

  it('should clear cache between tests', async () => {
    expect(provider.size).toBe(0)
  })
})
