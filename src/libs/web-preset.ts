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

// For node and React Native, `window.addEventListener` doesn't exist.
const addWindowEventListener =
  typeof window !== 'undefined' && typeof window.addEventListener !== 'undefined' ? window.addEventListener.bind(window) : null
const addDocumentEventListener =
  typeof document !== 'undefined'
    ? document.addEventListener.bind(document)
    : null

const isDocumentVisible = () => {
  if (addDocumentEventListener) {
    const visibilityState = document.visibilityState
    if (!isUndefined(visibilityState)) {
      return visibilityState !== 'hidden'
    }
  }
  // always assume it's visible
  return true
}

const registerOnFocus = (cb: () => void) => {
  if (addWindowEventListener && addDocumentEventListener) {
    // focus revalidate
    addDocumentEventListener('visibilitychange', () => cb())
    addWindowEventListener('focus', () => cb())
  }
}

const registerOnReconnect = (cb: () => void) => {
  if (addWindowEventListener) {
    // reconnect revalidate
    addWindowEventListener('online', () => {
      online = true
      cb()
    })

    // nothing to revalidate, just update the status
    addWindowEventListener('offline', () => (online = false))
  }
}

export default {
  isOnline,
  isDocumentVisible,
  registerOnFocus,
  registerOnReconnect
} as const
