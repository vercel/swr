import { listenerInterface } from '../types'

function addListener(
  listenerMap: Record<string, listenerInterface[]>,
  key: string,
  callback: listenerInterface
) {
  if (!callback) return
  if (listenerMap[key]) {
    listenerMap[key].push(callback)
  } else {
    listenerMap[key] = [callback]
  }
}

function removeListener(
  listenerMap: Record<string, listenerInterface[]>,
  key: string,
  callback: listenerInterface
) {
  const listeners = listenerMap[key] || []
  const index = listeners.indexOf(callback)
  if (index >= 0) {
    // 10x faster than splice
    // https://jsperf.com/array-remove-by-index
    listeners[index] = listeners[listeners.length - 1]
    listeners.pop()
  }
}

function invokeEvent(
  listenerMap: Record<string, listenerInterface[]>,
  key: string
): void {
  const listeners = listenerMap[key] || []
  listeners.forEach(listener => listener())
}

export { addListener, removeListener, invokeEvent }
