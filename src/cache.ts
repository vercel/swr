import { serialize } from './libs/serialize'
import {
  Cache as CacheType,
  Key,
  Provider,
  Mutator,
  ScopedMutator
} from './types'

// The factory that binds the `mutate` function to the specific cache object.
export function getCacheFactory(internalMutate: any) {
  return function createCache<Data>(
    provider: Provider
  ): {
    cache: CacheType
    mutate: ScopedMutator<Data>
  } {
    function cacheSet(key: Key, value: any) {
      const _key = typeof key === 'string' ? key : serialize(key)[0]
      provider.set(_key, value)
    }

    function cacheDelete(key: Key) {
      const [_key] = serialize(key)
      provider.delete(_key)
    }

    function cacheGet(key: Key): any {
      return provider.get(key)
    }

    const cache = {
      set: cacheSet,
      get: cacheGet,
      delete: cacheDelete
    }

    return {
      cache,
      mutate: (internalMutate as Mutator<Data>).bind(null, cache)
    }
  }
}

export const defaultCache = getCacheFactory(() => {})(new Map()).cache
