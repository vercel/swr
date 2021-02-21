function isOnline(): boolean {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.onLine !== 'undefined'
  ) {
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

const fetcher = url => fetch(url).then(res => res.json())

function onFocus(cb: () => void) {
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

function onReconnect(cb: () => void) {
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener !== 'undefined'
  ) {
    // reconnect revalidate
    window.addEventListener('online', () => cb(), false)
  }
}

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  onFocus,
  onReconnect
}
