import { act, screen } from '@testing-library/react'
import useSWR, { useSWRConfig, unload as globalUnload } from 'swr'
import useSWRInfinite from 'swr/infinite'
import {
  createKey,
  createResponse,
  renderWithConfig,
  renderWithGlobalCache,
  sleep
} from './utils'

describe('useSWR - unload', () => {
  let provider: Map<string, any>

  beforeEach(() => {
    provider = new Map()
  })

  it('should clear the cache and revalidate mounted hooks by default', async () => {
    const key = createKey()
    let version = 0
    let unload
    const fetcher = () => 'v' + version

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWR(key, fetcher, { dedupingInterval: 0 })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText('data:v0')

    version = 1
    await act(async () => unload())

    // The cleared key is refetched and shows the new value.
    await screen.findByText('data:v1')
  })

  it('should re-render mounted hooks with the empty cache without revalidating when `revalidate` is disabled', async () => {
    const key = createKey()
    let unload
    let fetcherCalls = 0
    const fetcher = () => {
      fetcherCalls++
      return 'value'
    }

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWR(key, fetcher, { dedupingInterval: 0 })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText('data:value')
    expect(fetcherCalls).toBe(1)

    await act(async () => unload({ revalidate: false }))

    screen.getByText('data:')
    expect(fetcherCalls).toBe(1)
    expect(provider.size).toBe(0)
  })

  it('should clear the special useSWRInfinite keys that key filters cannot match', async () => {
    const key = createKey()
    let unload

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWRInfinite(
        index => `${key}-${index}`,
        infiniteKey => createResponse('page-' + infiniteKey, { delay: 10 })
      )
      return <div>data:{data ? data.join(',') : ''}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText(`data:page-${key}-0`)

    // Both the `$inf$` meta key and the page keys are stored.
    expect([...provider.keys()].some(k => k.startsWith('$inf$'))).toBeTruthy()

    await act(async () => unload({ revalidate: false }))

    expect(provider.size).toBe(0)
    screen.getByText('data:')
  })

  it('should drop the previous data kept by `keepPreviousData`', async () => {
    const key = createKey()
    let unload

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWR(key, () => 'value', {
        keepPreviousData: true,
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText('data:value')

    await act(async () => unload({ revalidate: false }))

    // Without dropping the laggy data, the hook would keep rendering the
    // cleared value from its internal ref.
    screen.getByText('data:')
    expect(provider.size).toBe(0)
  })

  it('should drop the previous data of every hook sharing the key', async () => {
    const key = createKey()
    let unload

    function Item({ id }: { id: string }) {
      const { data } = useSWR(key, () => 'value', {
        keepPreviousData: true,
        dedupingInterval: 0
      })
      return (
        <div>
          {id}:{data}
        </div>
      )
    }

    function Page() {
      unload = useSWRConfig().unload
      return (
        <>
          <Item id="a" />
          <Item id="b" />
        </>
      )
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText('a:value')
    await screen.findByText('b:value')

    await act(async () => unload({ revalidate: false }))

    // Every hook on the key must reset its own previous data, not only the
    // first registered one.
    screen.getByText('a:')
    screen.getByText('b:')
  })

  it('should discard in-flight infinite page requests resolving after unload', async () => {
    const key = createKey()
    let unload

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWRInfinite(
        index => `${key}-${index}`,
        infiniteKey => createResponse('page-' + infiniteKey, { delay: 50 })
      )
      return <div>data:{data ? data.join(',') : ''}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    screen.getByText('data:')

    // Unload while the page request is still in flight, then wait for it to
    // resolve. Neither the page entry nor the `$inf$` meta entry may be
    // restored by the resolved request.
    await act(async () => unload({ revalidate: false }))
    await act(() => sleep(80))

    expect(provider.size).toBe(0)
    screen.getByText('data:')
  })

  it('should discard in-flight requests resolving after unload', async () => {
    const key = createKey()
    let unload
    const onDiscarded = jest.fn()
    const fetcher = () => createResponse('value', { delay: 50 })

    function Page() {
      unload = useSWRConfig().unload
      const { data } = useSWR(key, fetcher, {
        onDiscarded,
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    screen.getByText('data:')

    // Unload while the first request is still in flight, then wait for it
    // to resolve. The response must not be written back to the cache.
    await act(async () => unload({ revalidate: false }))
    await act(() => sleep(80))

    expect(onDiscarded).toHaveBeenCalledWith(key)
    expect(provider.size).toBe(0)
    screen.getByText('data:')
  })

  it('should ignore in-flight mutations resolving after unload', async () => {
    const key = createKey()
    let unload
    let mutate

    function Page() {
      const config = useSWRConfig()
      unload = config.unload
      mutate = config.mutate
      const { data } = useSWR(key, () => 'fetched', {
        dedupingInterval: 0,
        revalidateIfStale: false
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />, { provider: () => provider })
    await screen.findByText('data:fetched')

    // Start an async mutation, unload before it resolves.
    let mutationTask
    await act(async () => {
      mutationTask = mutate(key, createResponse('mutated', { delay: 50 }), {
        revalidate: false
      })
      unload({ revalidate: false })
    })
    await act(async () => {
      await mutationTask
    })

    // The mutation result must not be written back to the cache.
    expect(provider.get(key)).toBeUndefined()
    screen.getByText('data:')
  })

  it('should clear the default cache with the global unload', async () => {
    const key = createKey()
    let version = 0
    let unloadFromConfig

    function Page() {
      unloadFromConfig = useSWRConfig().unload
      const { data } = useSWR(key, () => 'v' + version, {
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithGlobalCache(<Page />)
    await screen.findByText('data:v0')

    // Without a custom provider, the bound unload is the global one.
    expect(unloadFromConfig).toBe(globalUnload)

    version = 1
    await act(async () => globalUnload())
    await screen.findByText('data:v1')
  })
})
