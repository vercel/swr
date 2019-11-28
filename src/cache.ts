const cache = new Map()
const requestIdleCallback =
  (typeof window !== 'undefined' ? window['requestIdleCallback'] : null) ||
  ((fn, ...args) => setTimeout(fn, 1, ...args))

function cacheGet(key: string): any {
  return cache.get(key)
}
function cacheSet(key: string, value: any) {
  cache.set(key, value)
}
function cacheDelete(key: string) {
  cache.delete(key)
}

// LRU cache collection implementation
// ===================================
const keyCnt = new Map()

let inactiveKeys = new Set()
let inactiveKeysToBeDeleted = new Set()

// we only store 300~600 inactive keys
const MAX_SIZE = 300
function activate(key) {
  if (inactiveKeys.has(key)) {
    inactiveKeys.delete(key)
    return
  }
  if (inactiveKeysToBeDeleted.has(key)) {
    inactiveKeysToBeDeleted.delete(key)
  }
}
function inactivate(key) {
  inactiveKeys.add(key)
  if (inactiveKeys.size >= MAX_SIZE) {
    // collect everything inside `inactiveKeysToBeDeleted`
    inactiveKeysToBeDeleted.forEach(cacheDelete)

    inactiveKeysToBeDeleted = inactiveKeys
    inactiveKeys = new Set()
  }
}

// when a hook mounts
function hookActive(...keys: string[]) {
  // don't block rendering, etc.
  requestIdleCallback(_keys => {
    for (let i = 0; i < _keys.length; ++i) {
      const key = _keys[i]
      keyCnt[key] = (keyCnt[key] || 0) + 1
      if (keyCnt[key] === 1) {
        activate(key)
      }
    }
  }, keys)
}

// when a hook unmounts
function hookInactive(...keys: string[]) {
  requestIdleCallback(_keys => {
    for (let i = 0; i < _keys.length; ++i) {
      const key = _keys[i]
      keyCnt[key] = keyCnt[key] - 1
      if (keyCnt[key] === 0) {
        inactivate(key)
      }
    }
  }, keys)
}
// ===================================

// reset
function cacheClear() {
  cache.clear()
  keyCnt.clear()
  inactiveKeys.clear()
  inactiveKeysToBeDeleted.clear()
}

export { cacheGet, cacheSet, cacheClear, hookActive, hookInactive }
