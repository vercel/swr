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

function setOnFocus(callback) {
  if (!isWindowEventTarget) return
  window.addEventListener('focus', callback, false)
  window.addEventListener('visibilitychange', callback, false)
}

function setOnConnect(callback) {
  if (!isWindowEventTarget) return
  window.addEventListener('online', callback, false)
}

const fetcher = url => fetch(url).then(res => res.json())

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  setOnFocus,
  setOnConnect
}
