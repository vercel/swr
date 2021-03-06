import { Cache as CacheType, Key, CacheListener } from './types'
import hash from './libs/hash'

export default class Cache implements CacheType {
  private __cache: Map<string, any>
  private __listeners: CacheListener[]

  constructor(initialData: any = {}) {
    this.__cache = new Map(Object.entries(initialData))
    this.__listeners = []
  }

  get(key: Key): any {
    const [_key] = this.serializeKey(key)
    return this.__cache.get(_key)
  }

  set(key: Key, value: any): any {
    const [_key] = this.serializeKey(key)
    this.__cache.set(_key, value)
    this.notify()
  }

  keys() {
    return Array.from(this.__cache.keys())
  }

  has(key: Key) {
    const [_key] = this.serializeKey(key)
    return this.__cache.has(_key)
  }

  clear() {
    this.__cache.clear()
    this.notify()
  }

  delete(key: Key) {
    const [_key] = this.serializeKey(key)
    this.__cache.delete(_key)
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
    this.__listeners.push(listener)

    return () => {
      if (!isSubscribed) return
      isSubscribed = false
      const index = this.__listeners.indexOf(listener)
      if (index > -1) {
        this.__listeners[index] = this.__listeners[this.__listeners.length - 1]
        this.__listeners.length--
      }
    }
  }

  // Notify Cache subscribers about a change in the cache
  private notify() {
    for (let listener of this.__listeners) {
      listener()
    }
  }
}
