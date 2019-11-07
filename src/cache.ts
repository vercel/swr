// Cache
const __cache = new Map()

function cacheGet(key: string): any {
  return __cache.get(key)
}

function cacheSet(key: string, value: any) {
  return __cache.set(key, value)
}

function cacheClear() {
  __cache.clear()
}

export { cacheGet, cacheSet, cacheClear }
