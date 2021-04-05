import { serialize } from './libs/serialize'
import { Cache, Key } from './types'

export function wrapCache(provider: Cache): Cache {
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

  return {
    set: cacheSet,
    get: cacheGet,
    delete: cacheDelete
  }
}
