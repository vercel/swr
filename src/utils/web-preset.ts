import { ConfigOptions } from '../types'
import { isUndefined, noop, hasWindow, hasDocument } from './helper'

/**
 * Due to bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a work around, we always assume it's online on first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online

// For node and React Native, `add/removeEventListener` doesn't exist on window.
const onWindowEvent = (hasWindow && addEventListener) || noop
const onDocumentEvent = (hasDocument && document.addEventListener) || noop

const isVisible = () => {
  const visibilityState = hasDocument && document.visibilityState
  if (!isUndefined(visibilityState)) {
    return visibilityState !== 'hidden'
  }
  return true
}

const initFocus = (cb: () => void) => {
  // focus revalidate
  onDocumentEvent('visibilitychange', cb)
  onWindowEvent('focus', cb)
}

const initReconnect = (cb: () => void) => {
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

export const defaultConfigOptions: ConfigOptions = {
  initFocus,
  initReconnect
}
