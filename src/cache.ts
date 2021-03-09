import { Cache as CacheType, Key, CacheListener } from './types'
import hash from './libs/hash'

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

  keys() {
    return Array.from(this.cache.keys())
  }

  has(key: Key) {
    const [_key] = this.serializeKey(key)
    return this.cache.has(_key)
  }

  clear() {
    this.cache.clear()
    this.notify()
  }

  delete(key: Key) {
    const [_key] = this.serializeKey(key)
    this.cache.delete(_key)
    this.notify()
  }

  // TODO: introduce namespace for the cache
  serializeKey(key: Key): [string, any, string, string] {
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
