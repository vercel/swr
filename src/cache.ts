import { Cache as CacheType, Key, CacheListener, CacheProvider } from './types'
import hash from './libs/hash'

export function serializeKey(key: Key): [string, any, string, string] {
  let args = null
  if (typeof key === 'function') {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  if (Array.isArray(key)) {
    // args array
    args = key
    key = hash(key)
  } else {
    // convert null to ''
    key = String(key || '')
  }

  const errorKey = key ? 'err@' + key : ''
  const isValidatingKey = key ? 'validating@' + key : ''

  return [key, args, errorKey, isValidatingKey]
}

export function createProvider(
  _provider: CacheProvider
): { provider: CacheType } {
  const _cache = new Map()

  function cacheSet(key: Key, value: any): any {
    const [_key] = serializeKey(key)
    _cache.set(_key, value)
    _provider.set(_key, value)
  }

  function cacheDelete(key: Key): void {
    const [_key] = serializeKey(key)
    _cache.delete(_key)
    _provider.delete(_key)
  }

  function cacheGet(key: Key): any {
    return _cache.get(key)
  }

  const provider = {
    set: cacheSet,
    get: cacheGet,
    delete: cacheDelete
  }

  return { provider }
}
export default class Cache implements CacheType {
  private cache: Map<string, any>
  private subs: CacheListener[]

  constructor(initialData: any = {}) {
    this.cache = new Map(Object.entries(initialData))
    this.subs = []
  }

  get(key: Key): any {
    const [_key] = this.serializeKey(key)
    return this.cache.get(_key)
  }

  set(key: Key, value: any): any {
    const [_key] = this.serializeKey(key)
    this.cache.set(_key, value)
    this.notify()
  }

  /**
   * @deprecate cache.subscribe will be removed
   */
  keys() {
    return Array.from(this.cache.keys())
  }

  /**
   * @deprecate cache.has will be removed
   */
  has(key: Key) {
    const [_key] = this.serializeKey(key)
    return this.cache.has(_key)
  }

  /**
   * @deprecate cache.clear will be removed
   */
  clear() {
    this.cache.clear()
    this.notify()
  }

  delete(key: Key) {
    const [_key] = this.serializeKey(key)
    this.cache.delete(_key)
    this.notify()
  }

  /**
   * @deprecate cache.serializeKey will be removed
   */
  serializeKey(key: Key): [string, any, string, string] {
    return serializeKey(key)
  }

  /**
   * @deprecate cache.subscribe will be removed
   */
  subscribe(listener: CacheListener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    let isSubscribed = true
    this.subs.push(listener)

    return () => {
      if (!isSubscribed) return
      isSubscribed = false
      const index = this.subs.indexOf(listener)
      if (index > -1) {
        this.subs[index] = this.subs[this.subs.length - 1]
        this.subs.length--
      }
    }
  }

  // Notify Cache subscribers about a change in the cache
  private notify() {
    for (let listener of this.subs) {
      listener()
    }
  }
}
