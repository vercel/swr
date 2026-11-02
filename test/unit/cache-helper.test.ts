import { createCacheHelper, initCache } from 'swr/_internal'
import type { State } from 'swr/_internal'
import { createKey } from '../utils'

describe('Cache helper', () => {
  const cleanups: (() => void)[] = []

  const createCache = (entries: [string, State][] = []) => {
    const provider = new Map(entries)
    const [, , , cleanup] = initCache(provider)
    if (cleanup) cleanups.push(cleanup)
    return provider
  }

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup()
  })

  it('should read an untouched cache after another cache writes the same key', () => {
    const key = createKey()
    const firstCache = createCache([[key, { data: 'first cache' }]])
    const secondCache = createCache()
    const [, setFirstCache] = createCacheHelper(firstCache, key)
    const [getSecondCache, , , getSecondSnapshot] = createCacheHelper(
      secondCache,
      key
    )

    setFirstCache({ data: 'updated first cache' })

    expect(getSecondSnapshot()).toBe(getSecondCache())
    expect(getSecondSnapshot()).toEqual({})
  })

  it('should preserve each cache initial value when both caches update', () => {
    const key = createKey()
    const firstInitial = { data: 'first cache' }
    const secondInitial = { data: 'second cache' }
    const firstCache = createCache([[key, firstInitial]])
    const secondCache = createCache([[key, secondInitial]])
    const [getFirstCache, setFirstCache, , getFirstSnapshot] =
      createCacheHelper(firstCache, key)
    const [getSecondCache, setSecondCache, , getSecondSnapshot] =
      createCacheHelper(secondCache, key)

    setFirstCache({ data: 'updated first cache' })
    setSecondCache({ data: 'updated second cache' })
    setFirstCache({ data: 'latest first cache' })
    setSecondCache({ data: 'latest second cache' })

    expect(getFirstSnapshot()).toBe(firstInitial)
    expect(getSecondSnapshot()).toBe(secondInitial)
    expect(getFirstCache().data).toBe('latest first cache')
    expect(getSecondCache().data).toBe('latest second cache')
  })

  it('should not reuse an empty snapshot from another cache', () => {
    const key = createKey()
    const firstCache = createCache()
    const secondInitial = { data: 'second cache' }
    const secondCache = createCache([[key, secondInitial]])
    const [, setFirstCache, , getFirstSnapshot] = createCacheHelper(
      firstCache,
      key
    )
    const [, setSecondCache, , getSecondSnapshot] = createCacheHelper(
      secondCache,
      key
    )

    setFirstCache({ data: 'updated first cache' })
    expect(getFirstSnapshot()).toBeUndefined()
    expect(getSecondSnapshot()).toBe(secondInitial)

    setSecondCache({ data: 'updated second cache' })
    expect(getSecondSnapshot()).toBe(secondInitial)
  })

  it('should share the initial snapshot between helpers for the same cache', () => {
    const key = createKey()
    const initial = { data: 'initial value' }
    const cache = createCache([[key, initial]])
    const [, setFirstHelper, , getFirstSnapshot] = createCacheHelper(cache, key)
    const [, setSecondHelper, , getSecondSnapshot] = createCacheHelper(
      cache,
      key
    )

    setFirstHelper({ data: 'first update' })
    setSecondHelper({ data: 'second update' })

    expect(getFirstSnapshot()).toBe(initial)
    expect(getSecondSnapshot()).toBe(initial)
    expect(createCacheHelper(cache, key)[3]()).toBe(initial)
  })

  it('should snapshot different keys in the same cache independently', () => {
    const firstKey = createKey()
    const secondKey = createKey()
    const firstInitial = { data: 'first key' }
    const secondInitial = { data: 'second key' }
    const cache = createCache([
      [firstKey, firstInitial],
      [secondKey, secondInitial]
    ])
    const [, setFirstKey, , getFirstSnapshot] = createCacheHelper(
      cache,
      firstKey
    )
    const [, setSecondKey, , getSecondSnapshot] = createCacheHelper(
      cache,
      secondKey
    )

    setFirstKey({ data: 'updated first key' })
    expect(getSecondSnapshot()).toBe(secondInitial)
    setSecondKey({ data: 'updated second key' })

    expect(getFirstSnapshot()).toBe(firstInitial)
    expect(getSecondSnapshot()).toBe(secondInitial)
  })

  it('should ignore writes for an undefined key', () => {
    const cache = createCache()
    const [getCache, setCache, , getSnapshot] = createCacheHelper(
      cache,
      undefined
    )

    setCache({ data: 'ignored' })

    expect(cache.size).toBe(0)
    expect(getSnapshot()).toBe(getCache())
    expect(getSnapshot()).toEqual({})
  })
})
