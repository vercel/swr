/**
 * Due to bug https://bugs.chromium.org/p/chromium/issues/detail?id=678075,
 * it's not reliable to detect if the browser is currently online or offline
 * based on `navigator.onLine`.
 * As a work around, we always assume it's online on first load, and change
 * the status upon `online` or `offline` events.
 */
let online = true
const isOnline = () => online

function isDocumentVisible(): boolean {
  if (
    typeof document !== 'undefined' &&
    typeof document.visibilityState !== 'undefined'
  ) {
    return document.visibilityState !== 'hidden'
  }
  // always assume it's visible
  return true
}

const fetcher = url => fetch(url).then(res => res.json())

function registerOnFocus(cb: () => void) {
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof document.addEventListener !== 'undefined'
  ) {
    // focus revalidate
    document.addEventListener('visibilitychange', () => cb(), false)
    window.addEventListener('focus', () => cb(), false)
  }
}

function registerOnReconnect(cb: () => void) {
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener !== 'undefined'
  ) {
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

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  registerOnFocus,
  registerOnReconnect
}
