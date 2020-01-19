import { CacheInterface } from './types'
import { mutate } from './use-swr'

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
}
