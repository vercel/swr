import { CacheInterface, keyInterface } from './types'
import { mutate } from './use-swr'
import hash from './libs/hash'

export default class Cache implements CacheInterface {
  __cache: Map<string, any>

  constructor(initialData: any = {}) {
    this.__cache = new Map(Object.entries(initialData))
  }

  get(key: string): any {
    return this.__cache.get(key)
  }

  set(key: string, value: any, shouldNotify = true): any {
    this.__cache.set(key, value)
    if (shouldNotify) mutate(key, value, false)
  }

  has(key: string) {
    return this.__cache.has(key)
  }

  clear(shouldNotify = true) {
    if (shouldNotify) this.__cache.forEach(key => mutate(key, null, false))
    this.__cache.clear()
  }

  delete(key: string, shouldNotify = true) {
    if (shouldNotify) mutate(key, null, false)
    this.__cache.delete(key)
  }

  // TODO: introduce namespace for the cache
  serializeKey(key: keyInterface): [string, any, string] {
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

    return [key, args, errorKey]
  }
}
