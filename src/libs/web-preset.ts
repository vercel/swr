const isWindowEventTarget =
  typeof window !== 'undefined' && window.addEventListener

function isOnline(): boolean {
  if (typeof navigator.onLine !== 'undefined') {
    return navigator.onLine
  }
  // always assume it's online
  return true
}

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

const fetcher = (url: any) => fetch(url).then(res => res.json())

function setOnFocus(callback: (...args: unknown[]) => void) {
  if (!isWindowEventTarget) return
  window.addEventListener('focus', callback, false)
  window.addEventListener('visibilitychange', callback, false)
}

function setOnConnect(callback: (...args: unknown[]) => void) {
  if (!isWindowEventTarget) return
  window.addEventListener('online', callback, false)
}

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  setOnFocus,
  setOnConnect
}
