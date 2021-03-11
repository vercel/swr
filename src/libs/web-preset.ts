import { useEffect, useLayoutEffect } from 'react'

/**
 * Due to bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a work around, we always assume it's online on first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online

const isDocumentVisible = () => {
  if (
    typeof document !== 'undefined' &&
    document.visibilityState !== undefined
  ) {
    return document.visibilityState !== 'hidden'
  }
  // always assume it's visible
  return true
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const registerOnFocus = (cb: () => void) => {
  if (
    typeof window !== 'undefined' &&
    window.addEventListener !== undefined &&
    typeof document !== 'undefined' &&
    document.addEventListener !== undefined
  ) {
    // focus revalidate
    document.addEventListener('visibilitychange', () => cb(), false)
    window.addEventListener('focus', () => cb(), false)
  }
}

const registerOnReconnect = (cb: () => void) => {
  if (typeof window !== 'undefined' && window.addEventListener !== undefined) {
    // reconnect revalidate
    window.addEventListener(
      'online',
      () => {
        online = true
        cb()
      },
      false
    )

    // nothing to revalidate, just update the status
    window.addEventListener('offline', () => (online = false), false)
  }
}

const IS_SERVER =
  typeof window === 'undefined' ||
  // @ts-ignore
  !!(typeof Deno !== 'undefined' && Deno && Deno.version && Deno.version.deno)

// polyfill for requestAnimationFrame
const rAF = IS_SERVER
  ? null
  : window['requestAnimationFrame'] || (f => setTimeout(f, 1))

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.
const useIsomorphicLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  registerOnFocus,
  registerOnReconnect,
  rAF,
  useIsomorphicLayoutEffect,
  IS_SERVER
}
