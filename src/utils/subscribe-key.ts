import { RevalidateCallback, StateUpdateCallback } from '../types'

// Add a callback function to a list of keyed callback functions and return
// the unsubscribe function.
export const subscribeCallback = (
  key: string,
  callbacks: Record<string, (RevalidateCallback | StateUpdateCallback)[]>,
  callback: RevalidateCallback | StateUpdateCallback
) => {
  const keyedRevalidators = callbacks[key] || (callbacks[key] = [])
  keyedRevalidators.push(callback)

  return () => {
    const index = keyedRevalidators.indexOf(callback)

    if (index >= 0) {
      // O(1): faster than splice
      keyedRevalidators[index] = keyedRevalidators[keyedRevalidators.length - 1]
      keyedRevalidators.pop()
    }
  }
}
