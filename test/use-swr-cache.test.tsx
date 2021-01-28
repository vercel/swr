import { act, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { mutate, cache } from '../src'
import Cache from '../src/cache'

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
