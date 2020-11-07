import { listenerInterface } from '../types'
import { addListener, removeListener, invokeEvent } from './events'

const isWindowEventTarget =
  typeof window !== 'undefined' && window.addEventListener

const domListenersMap: Record<string, listenerInterface[]> = {}
const hasNoListeners = (event: string): boolean =>
  !domListenersMap[event] || domListenersMap[event].length === 0

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

const invokeFocus = () => invokeEvent(domListenersMap, 'focus')
const invokeOnline = () => invokeEvent(domListenersMap, 'online')

function setOnFocus(callback: listenerInterface): () => void {
  if (!isWindowEventTarget) return () => {}
  // when first listener attach
  if (hasNoListeners('focus')) {
    window.addEventListener('focus', invokeFocus, false)
    window.addEventListener('visibilitychange', invokeFocus, false)
  }
  addListener(domListenersMap, 'focus', callback)

  return () => {
    removeListener(domListenersMap, 'focus', callback)
    // when last listener dettach
    if (hasNoListeners('focus')) {
      window.removeEventListener('focus', invokeFocus, false)
      window.removeEventListener('visibilitychange', invokeFocus, false)
    }
  }
}

function setOnConnect(callback: listenerInterface): () => void {
  if (!isWindowEventTarget) return () => {}
  // when first listener attach
  if (hasNoListeners('online')) {
    window.addEventListener('online', invokeOnline, false)
  }
  addListener(domListenersMap, 'online', callback)
  return () => {
    removeListener(domListenersMap, 'online', callback)
    // when last listener dettach
    if (hasNoListeners('online')) {
      window.removeEventListener('online', invokeOnline, false)
    }
  }
}

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  setOnFocus,
  setOnConnect
}
