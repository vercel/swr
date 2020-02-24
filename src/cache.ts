import { CacheInterface, keyInterface, cacheListener } from './types'
import { mutate } from './use-swr'
import hash from './libs/hash'

export default class Cache implements CacheInterface {
  private __cache: Map<string, any>
  private __listeners: cacheListener[]

  constructor(initialData: any = {}) {
    this.__cache = new Map(Object.entries(initialData))
    this.__listeners = [];
  }

  get(key: string): any {
    return this.__cache.get(key)
  }

  set(key: string, value: any, shouldNotify = true): any {
    this.__cache.set(key, value)
    if (shouldNotify) mutate(key, value, false)
    this.notify()
  }

  keys() {
    return Array.from(this.__cache.keys())
  }

  has(key: string) {
    return this.__cache.has(key)
  }

  clear(shouldNotify = true) {
    if (shouldNotify) this.__cache.forEach(key => mutate(key, null, false))
    this.__cache.clear()
    this.notify()
  }

  delete(key: string, shouldNotify = true) {
    if (shouldNotify) mutate(key, null, false)
    this.__cache.delete(key)
    this.notify()
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

  subscribe(listener: cacheListener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    let isSubscribed = true;
    this.__listeners.push(listener)

    return () => {
      if (!isSubscribed) return;
      isSubscribed = false;
      const index = this.__listeners.indexOf(listener)
      this.__listeners.splice(index, 1)
    }
  }

  // Notify Cache subscribers about a change in the cache
  private notify() {
    for (let listener of this.__listeners) {
      listener()
    }
  }
}
