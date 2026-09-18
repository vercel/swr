import { act, screen } from '@testing-library/react'
import useSWR, {
  invalidateTag as globalInvalidateTag,
  SWRConfig,
  unload as globalUnload,
  useSWRConfig
} from 'swr'
import type { TagInvalidator, Unloader } from 'swr'
import { createKey, renderWithConfig, renderWithGlobalCache } from './utils'

describe('useSWR - tags', () => {
  it('revalidates every key associated with a tag', async () => {
    const projectKey = createKey()
    const favoriteKey = createKey()
    const unrelatedKey = createKey()
    let invalidateTag!: TagInvalidator
    let version = 0
    const calls: Record<string, number> = {}
    const fetcher = (key: string) => {
      calls[key] = (calls[key] || 0) + 1
      return `${key}:${version}`
    }

    function Page() {
      invalidateTag = useSWRConfig().invalidateTag
      const { data: projects } = useSWR(projectKey, fetcher, {
        tags: ['projects'],
        dedupingInterval: 0
      })
      const { data: favorites } = useSWR(favoriteKey, fetcher, {
        tags: ['projects'],
        dedupingInterval: 0
      })
      const { data: unrelated } = useSWR(unrelatedKey, fetcher, {
        tags: ['other'],
        dedupingInterval: 0
      })
      return (
        <>
          <div>projects:{projects}</div>
          <div>favorites:{favorites}</div>
          <div>unrelated:{unrelated}</div>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText(`projects:${projectKey}:0`)
    await screen.findByText(`favorites:${favoriteKey}:0`)
    await screen.findByText(`unrelated:${unrelatedKey}:0`)

    version = 1
    await act(() => invalidateTag('projects'))

    await screen.findByText(`projects:${projectKey}:1`)
    await screen.findByText(`favorites:${favoriteKey}:1`)
    screen.getByText(`unrelated:${unrelatedKey}:0`)
    expect(calls).toEqual({
      [projectKey]: 2,
      [favoriteKey]: 2,
      [unrelatedKey]: 1
    })
  })

  it('exposes an invalidator for the default cache', async () => {
    const key = createKey()
    const tag = createKey()
    let fetcherCalls = 0

    function Page() {
      const { data } = useSWR(key, () => ++fetcherCalls, {
        tags: [tag],
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithGlobalCache(<Page />)
    await screen.findByText('data:1')
    await act(() => globalInvalidateTag(tag))
    await screen.findByText('data:2')
    act(() => globalUnload({ revalidate: false }))
  })

  it('resolves tag functions when the fetcher settles', async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let currentTag = 'old'
    let fetcherCalls = 0
    let resolve!: (data: string) => void
    const firstResponse = new Promise<string>(_resolve => {
      resolve = _resolve
    })

    function Page() {
      invalidateTag = useSWRConfig().invalidateTag
      const { data } = useSWR(
        key,
        () => {
          fetcherCalls++
          return fetcherCalls === 1 ? firstResponse : 'updated'
        },
        { tags: () => [currentTag], dedupingInterval: 0 }
      )
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    currentTag = 'new'
    await act(async () => resolve('initial'))
    await screen.findByText('data:initial')

    await act(() => invalidateTag('old'))
    expect(fetcherCalls).toBe(1)

    await act(() => invalidateTag('new'))
    await screen.findByText('data:updated')
    expect(fetcherCalls).toBe(2)
  })

  it("replaces a key's tag associations after a later fetch", async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let currentTag = 'old'
    let fetcherCalls = 0

    function Page() {
      invalidateTag = useSWRConfig().invalidateTag
      const { data } = useSWR(key, () => ++fetcherCalls, {
        tags: () => [currentTag],
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:1')

    currentTag = 'new'
    await act(() => invalidateTag('old'))
    await screen.findByText('data:2')

    await act(() => invalidateTag('old'))
    expect(fetcherCalls).toBe(2)

    await act(() => invalidateTag('new'))
    await screen.findByText('data:3')
  })

  it('associates a key when its fetcher rejects', async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let shouldFail = true
    let fetcherCalls = 0

    function Page() {
      invalidateTag = useSWRConfig().invalidateTag
      const { data, error } = useSWR(
        key,
        () => {
          fetcherCalls++
          if (shouldFail) throw new Error('failed')
          return 'recovered'
        },
        {
          tags: ['resource'],
          shouldRetryOnError: false,
          dedupingInterval: 0
        }
      )
      return <div>{error ? error.message : `data:${data}`}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('failed')

    shouldFail = false
    await act(() => invalidateTag('resource'))
    await screen.findByText('data:recovered')
    expect(fetcherCalls).toBe(2)
  })

  it('makes the association available to settlement callbacks', async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let fetcherCalls = 0
    let invalidated = false

    function Page() {
      invalidateTag = useSWRConfig().invalidateTag
      const { data } = useSWR(key, () => ++fetcherCalls, {
        tags: ['resource'],
        dedupingInterval: 0,
        onSuccess: () => {
          if (!invalidated) {
            invalidated = true
            void invalidateTag('resource')
          }
        }
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:2')
    expect(fetcherCalls).toBe(2)
  })

  it('scopes tag invalidation to the current cache provider', async () => {
    const keyA = createKey()
    const keyB = createKey()
    let invalidateTagA!: TagInvalidator
    let invalidateTagB!: TagInvalidator
    let callsA = 0
    let callsB = 0

    function Item({ cache }: { cache: 'a' | 'b' }) {
      const config = useSWRConfig()
      if (cache === 'a') invalidateTagA = config.invalidateTag
      else invalidateTagB = config.invalidateTag
      const { data } = useSWR(
        cache === 'a' ? keyA : keyB,
        () => (cache === 'a' ? ++callsA : ++callsB),
        { tags: ['shared'], dedupingInterval: 0 }
      )
      return (
        <div>
          {cache}:{data}
        </div>
      )
    }

    renderWithConfig(
      <>
        <SWRConfig value={{ provider: () => new Map() }}>
          <Item cache="a" />
        </SWRConfig>
        <SWRConfig value={{ provider: () => new Map() }}>
          <Item cache="b" />
        </SWRConfig>
      </>
    )
    await screen.findByText('a:1')
    await screen.findByText('b:1')

    await act(() => invalidateTagA('shared'))
    await screen.findByText('a:2')
    expect(callsB).toBe(1)

    await act(() => invalidateTagB('shared'))
    await screen.findByText('b:2')
  })

  it('clears tag associations on unload', async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let unload!: Unloader
    let fetcherCalls = 0

    function Page() {
      const config = useSWRConfig()
      invalidateTag = config.invalidateTag
      unload = config.unload
      const { data } = useSWR(key, () => ++fetcherCalls, {
        tags: ['resource'],
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:1')

    act(() => unload({ revalidate: false }))
    screen.getByText('data:')
    await act(() => invalidateTag('resource'))
    expect(fetcherCalls).toBe(1)
  })

  it('does not restore associations when a request settles after unload', async () => {
    const key = createKey()
    let invalidateTag!: TagInvalidator
    let unload!: Unloader
    let fetcherCalls = 0
    let resolve!: (data: string) => void
    const response = new Promise<string>(_resolve => {
      resolve = _resolve
    })

    function Page() {
      const config = useSWRConfig()
      invalidateTag = config.invalidateTag
      unload = config.unload
      const { data } = useSWR(
        key,
        () => {
          fetcherCalls++
          return response
        },
        { tags: ['resource'], dedupingInterval: 0 }
      )
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')
    act(() => unload({ revalidate: false }))
    await act(async () => resolve('late'))

    await act(() => invalidateTag('resource'))
    expect(fetcherCalls).toBe(1)
    screen.getByText('data:')
  })
})
