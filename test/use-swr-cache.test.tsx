import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { mutate, cache, createProvider, SWRConfig } from '../src'
import Cache from '../src/cache'
import { sleep } from './utils'

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
    render(
      <React.Suspense fallback={null}>
        <Page />
      </React.Suspense>
    )

    // content should come from custom cache
    await screen.findByText('custom cache message')

    // content should be updated with fetcher results
    await screen.findByText('random message')
    const value = 'a different message'
    act(() => {
      cache.set('cache-1', value)
    })
    await act(async () => mutate('cache-1', value, false))

    // content should be updated from new cache value, after mutate without revalidate
    await screen.findByText('a different message')
    act(() => {
      cache.delete('cache-1')
    })
    await act(() => mutate('cache-1'))

    // content should go back to be the fetched value
    await screen.findByText('random message')
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

describe('useSWR - UNSTABLE custom cache', () => {
  it('should be able to get cache changes through cache.set', async () => {
    const getKey = _key => 'custom-cache-1' + _key
    const fetcher = _key => 'res:' + _key
    const key1 = getKey(1)
    const key2 = getKey(2)

    const customCache = new Map()

    function Section() {
      const [index, setIndex] = useState(1)
      const { data } = useSWR(getKey(index), fetcher)

      return <div onClick={() => setIndex(2)}>{data}</div>
    }

    const { provider } = createProvider(customCache)
    function Page() {
      return (
        <SWRConfig value={{ provider }}>
          <Section />
        </SWRConfig>
      )
    }

    const { container } = render(<Page />)
    await screen.findByText(fetcher(key1))

    expect(customCache.get(key2)).toBe(undefined)
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(10))
    // await act(async () => await mutate(key2, fetcher(key2)))

    expect(customCache.get(key1)).toBe(fetcher(key1))
    expect(customCache.get(key2)).toBe(fetcher(key2))
  })
})
