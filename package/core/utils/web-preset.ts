import { ProviderConfiguration } from '../types'
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

const hasWin = hasWindow()
const hasDoc = hasDocument()

// For node and React Native, `add/removeEventListener` doesn't exist on window.
const onWindowEvent =
  hasWin && window.addEventListener
    ? window.addEventListener.bind(window)
    : noop
const onDocumentEvent = hasDoc ? document.addEventListener.bind(document) : noop
const offWindowEvent =
  hasWin && window.removeEventListener
    ? window.removeEventListener.bind(window)
    : noop
const offDocumentEvent = hasDoc
  ? document.removeEventListener.bind(document)
  : noop

const isVisible = () => {
  const visibilityState = hasDoc && document.visibilityState
  return isUndefined(visibilityState) || visibilityState !== 'hidden'
}

const initFocus = (callback: () => void) => {
  // focus revalidate
  onDocumentEvent('visibilitychange', callback)
  onWindowEvent('focus', callback)
  return () => {
    offDocumentEvent('visibilitychange', callback)
    offWindowEvent('focus', callback)
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
