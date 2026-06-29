import type { Cache, State, GlobalState } from '../types'
import { SWRGlobalState } from './global-state'
import { isUndefined, mergeObjects, noop } from './shared'

const EMPTY_CACHE = {}
const INITIAL_CACHE: Record<string, any> = {}

const STR_UNDEFINED = 'undefined'

// NOTE: Use the function to guarantee it's re-evaluated between jsdom and node runtime for tests.
export const isWindowDefined = typeof window != STR_UNDEFINED
export const isDocumentDefined = typeof document != STR_UNDEFINED
export const isLegacyDeno = isWindowDefined && 'Deno' in window

export const hasRequestAnimationFrame = () =>
  isWindowDefined && typeof window['requestAnimationFrame'] != STR_UNDEFINED

export const createCacheHelper = <Data = any, T = State<Data, any>>(
  cache: Cache,
  key: string | undefined
) => {
  const state = SWRGlobalState.get(cache) as GlobalState | undefined
  return [
    // Getter
    () => ((!isUndefined(key) && cache.get(key)) || EMPTY_CACHE) as T,
    // Setter
    (info: T) => {
      if (!isUndefined(key)) {
        const prev = cache.get(key)

        // Before writing to the store, we keep the value in the initial cache
        // if it's not there yet.
        if (!(key in INITIAL_CACHE)) {
          INITIAL_CACHE[key] = prev
        }

        // Guard against undefined state - can happen in React Native New
        // Architecture where SWRGlobalState.get(cache) returns undefined
        // during initial renders before the provider has initialized.
        if (state) {
          state[5](key, mergeObjects(prev, info), prev || EMPTY_CACHE)
        }
      }
    },
    // Subscriber
    state ? state[6] : () => noop,
    // Get server cache snapshot
    () => {
      if (!isUndefined(key)) {
        // If the cache was updated on the client, we return the stored initial value.
        if (key in INITIAL_CACHE) return INITIAL_CACHE[key]
      }

      // If we haven't done any client-side updates, we return the current value.
      return ((!isUndefined(key) && cache.get(key)) || EMPTY_CACHE) as T
    }
  ] as const
}

// export { UNDEFINED, OBJECT, isUndefined, isFunction, mergeObjects, isPromiseLike }
