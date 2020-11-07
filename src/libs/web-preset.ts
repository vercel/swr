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
const invokeReconnect = () => invokeEvent(domListenersMap, 'reconnect')

function useOnFocus(callback: listenerInterface): () => void {
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

function useOnConnect(callback: listenerInterface): () => void {
  if (!isWindowEventTarget) return () => {}
  // when first listener attach
  if (hasNoListeners('reconnect')) {
    window.addEventListener('online', invokeReconnect, false)
  }
  addListener(domListenersMap, 'reconnect', callback)
  return () => {
    removeListener(domListenersMap, 'reconnect', callback)
    // when last listener dettach
    if (hasNoListeners('reconnect')) {
      window.removeEventListener('online', invokeReconnect, false)
    }
  }
}

export default {
  isOnline,
  isDocumentVisible,
  fetcher,
  useOnFocus,
  useOnConnect
}
