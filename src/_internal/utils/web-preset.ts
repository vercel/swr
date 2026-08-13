import type { ProviderConfiguration } from '../types'
import { isWindowDefined, isDocumentDefined } from './helper'
import { isUndefined, noop } from './shared'

/**
 * Due to the bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a workaround, we always assume it's online on the first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online

/**
 * Track window focus state to handle OS-level window switches (Alt-Tab)
 * where document.visibilityState may remain 'visible' but the window
 * has lost focus. This ensures refreshWhenHidden works correctly.
 */
let focused = true

// For node and React Native, `add/removeEventListener` doesn't exist on window.
const [onWindowEvent, offWindowEvent] =
  isWindowDefined && window.addEventListener
    ? [
        window.addEventListener.bind(window),
        window.removeEventListener.bind(window)
      ]
    : [noop, noop]

const isVisible = () => {
  const visibilityState = isDocumentDefined && document.visibilityState
  if (!isUndefined(visibilityState) && visibilityState === 'hidden') {
    return false
  }
  return focused
}

const initFocus = (callback: () => void) => {
  // focus revalidate
  if (isDocumentDefined) {
    document.addEventListener('visibilitychange', callback)
  }
  onWindowEvent('focus', callback)

  // Track window focus/blur for OS-level window switches (Alt-Tab).
  // visibilityState may remain 'visible' when alt-tabbing, so we track
  // window focus state to ensure refreshWhenHidden works correctly.
  const onFocus = () => {
    focused = true
  }
  const onBlur = () => {
    focused = false
  }
  onWindowEvent('focus', onFocus)
  onWindowEvent('blur', onBlur)

  return () => {
    if (isDocumentDefined) {
      document.removeEventListener('visibilitychange', callback)
    }
    offWindowEvent('focus', callback)
    offWindowEvent('focus', onFocus)
    offWindowEvent('blur', onBlur)
  }
}

const initReconnect = (callback: () => void) => {
  // revalidate on reconnected
  const onOnline = () => {
    online = true
    callback()
  }
  // nothing to revalidate, just update the status
  const onOffline = () => {
    online = false
  }
  onWindowEvent('online', onOnline)
  onWindowEvent('offline', onOffline)
  return () => {
    offWindowEvent('online', onOnline)
    offWindowEvent('offline', onOffline)
  }
}

export const preset = {
  isOnline,
  isVisible
} as const

export const defaultConfigOptions: ProviderConfiguration = {
  initFocus,
  initReconnect
}
