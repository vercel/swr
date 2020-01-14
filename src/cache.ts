import { CacheInterface } from './types'

export default class Cache implements CacheInterface {
  __cache: Map<string, any>

  constructor(initialData: any = {}) {
    this.__cache = new Map(Object.entries(initialData))
  }

  get(key: string): any {
    return this.__cache.get(key)
  }

  set(key: string, value: any): any {
    return this.__cache.set(key, value)
  }

  clear() {
    this.__cache.clear()
  }

  delete(key: string) {
    this.__cache.delete(key)
  }

  has(key: string) {
    return this.__cache.has(key)
  }
}
