import { isUndefined } from './helper'

/**
 * Due to bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a work around, we always assume it's online on first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online
const createNoop = (ret?: any) => () => ret
const add = 'addEventListener'
const remove = 'removeEventListener'

type EventAction = 'addEventListener' | 'removeEventListener'

const hasWindow = typeof window !== 'undefined'
const hasDocument = typeof document !== 'undefined'

// For node and React Native, `add/removeEventListener` doesn't exist on window.
const windowEventListener = (action: EventAction) =>
  hasWindow && !isUndefined(window[action])
    ? window[action].bind(window)
    : createNoop()
const documentEventListener = (action: EventAction) =>
  hasDocument ? document[action].bind(document) : createNoop()

const isDocumentVisible = () => {
  const visibilityState = hasDocument && document.visibilityState
  if (!isUndefined(visibilityState)) {
    return visibilityState !== 'hidden'
  }
  return true
}

const attachOnFocus = (cb: () => void) => {
  // focus revalidate
  documentEventListener(add)('visibilitychange', cb)
  windowEventListener(add)('focus', cb)
  return () => {
    documentEventListener(remove)('visibilitychange', cb)
    windowEventListener(remove)('focus', cb)
  }
}

const attachOnReconnect = (cb: () => void) => {
  const onOnline = () => {
    online = true
    cb()
  }
  const onOffline = () => {
    online = false
  }
  // reconnect revalidate
  windowEventListener(add)('online', onOnline)
  // nothing to revalidate, just update the status
  windowEventListener(add)('offline', onOffline)

  return () => {
    windowEventListener(remove)('online', onOnline)
    windowEventListener(remove)('offline', onOffline)
  }
}

export default {
  isOnline,
  isDocumentVisible,
  attachOnFocus,
  attachOnReconnect
} as const
