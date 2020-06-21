import deepEqual from 'fast-deep-equal'
import isDocumentVisible from './libs/is-document-visible'
import isOnline from './libs/is-online'
import {
  ConfigInterface,
  RevalidateOptionInterface,
  revalidateType
} from './types'
import Cache from './cache'

// cache
const cache = new Cache()

// state managers
const CONCURRENT_PROMISES = {}
const CONCURRENT_PROMISES_TS = {}
const FOCUS_REVALIDATORS = {}
const RECONNECT_REVALIDATORS = {}
const CACHE_REVALIDATORS = {}
const MUTATION_TS = {}
const MUTATION_END_TS = {}

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

  if (config.errorRetryCount && opts.retryCount > config.errorRetryCount) {
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

// setup DOM events listeners for `focus` and `reconnect` actions
if (typeof window !== 'undefined' && window.addEventListener) {
  const revalidate = revalidators => {
    if (!isDocumentVisible() || !isOnline()) return

    for (const key in revalidators) {
      if (revalidators[key][0]) revalidators[key][0]()
    }
  }

  // focus revalidate
  window.addEventListener(
    'visibilitychange',
    () => revalidate(FOCUS_REVALIDATORS),
    false
  )
  window.addEventListener('focus', () => revalidate(FOCUS_REVALIDATORS), false)
  // reconnect revalidate
  window.addEventListener(
    'online',
    () => revalidate(RECONNECT_REVALIDATORS),
    false
  )
}

export {
  CONCURRENT_PROMISES,
  CONCURRENT_PROMISES_TS,
  FOCUS_REVALIDATORS,
  RECONNECT_REVALIDATORS,
  CACHE_REVALIDATORS,
  MUTATION_TS,
  MUTATION_END_TS,
  cache
}
export default defaultConfig
