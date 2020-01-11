import deepEqual from 'fast-deep-equal'
import isDocumentVisible from './libs/is-document-visible'
import isOnline from './libs/is-online'
import {
  ConfigInterface,
  RevalidateOptionInterface,
  revalidateType
} from './types'

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

// state managers
const CONCURRENT_PROMISES = {}
const CONCURRENT_PROMISES_TS = {}
const FOCUS_REVALIDATORS = {}
const CACHE_REVALIDATORS = {}
const MUTATION_TS = {}

// error retry
function onErrorRetry(
  _,
  __,
  config: ConfigInterface,
  revalidate: revalidateType,
  opts: RevalidateOptionInterface
): void {
  if (!isDocumentVisible()) {
    // if it's hidden, stop
    // it will auto revalidate when focus
    return
  }

  // exponential backoff
  const count = Math.min(opts.retryCount || 0, 8)
  const timeout =
    ~~((Math.random() + 0.5) * (1 << count)) * config.errorRetryInterval
  setTimeout(revalidate, timeout, opts)
}

// client side: need to adjust the config
// based on the browser status
// slow connection (<= 70Kbps)
const slowConnection =
  typeof window !== 'undefined' &&
  navigator['connection'] &&
  ['slow-2g', '2g'].indexOf(navigator['connection'].effectiveType) !== -1

// config
const defaultConfig: ConfigInterface = {
  // events
  onLoadingSlow: () => {},
  onSuccess: () => {},
  onError: () => {},
  onErrorRetry,

  errorRetryInterval: (slowConnection ? 10 : 5) * 1000,
  focusThrottleInterval: 5 * 1000,
  dedupingInterval: 2 * 1000,
  loadingTimeout: (slowConnection ? 5 : 3) * 1000,

  refreshInterval: 0,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  shouldRetryOnError: true,
  suspense: false,
  compare: deepEqual
}

// Focus revalidate
let eventsBinded = false
if (typeof window !== 'undefined' && window.addEventListener && !eventsBinded) {
  const revalidate = () => {
    if (!isDocumentVisible() || !isOnline()) return

    for (let key in FOCUS_REVALIDATORS) {
      if (FOCUS_REVALIDATORS[key][0]) FOCUS_REVALIDATORS[key][0]()
    }
  }
  window.addEventListener('visibilitychange', revalidate, false)
  window.addEventListener('focus', revalidate, false)
  // only bind the events once
  eventsBinded = true
}

export {
  CONCURRENT_PROMISES,
  CONCURRENT_PROMISES_TS,
  FOCUS_REVALIDATORS,
  CACHE_REVALIDATORS,
  MUTATION_TS,
  cacheGet,
  cacheSet,
  cacheClear
}
export default defaultConfig
