import { ProviderOptions } from '../types'
import { isUndefined, noop } from './helper'

/**
 * Due to bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a work around, we always assume it's online on first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online
const hasWindow = typeof window !== 'undefined'
const hasDocument = typeof document !== 'undefined'
const ADD_EVENT_LISTENER = 'addEventListener'

// For node and React Native, `add/removeEventListener` doesn't exist on window.
const onWindowEvent =
  hasWindow && window[ADD_EVENT_LISTENER] ? window[ADD_EVENT_LISTENER] : noop
const onDocumentEvent = hasDocument ? document[ADD_EVENT_LISTENER] : noop

const isVisible = () => {
  const visibilityState = hasDocument && document.visibilityState
  if (!isUndefined(visibilityState)) {
    return visibilityState !== 'hidden'
  }
  return true
}

const setupOnFocus = (cb: () => void) => {
  // focus revalidate
  onDocumentEvent('visibilitychange', cb)
  onWindowEvent('focus', cb)
}

const setupOnReconnect = (cb: () => void) => {
  // reconnect revalidate
  onWindowEvent('online', () => {
    online = true
    cb()
  })
  // nothing to revalidate, just update the status
  onWindowEvent('offline', () => {
    online = false
  })
}

export const preset = {
  isOnline,
  isVisible
} as const

export const provider: ProviderOptions = {
  setupOnFocus,
  setupOnReconnect
}
