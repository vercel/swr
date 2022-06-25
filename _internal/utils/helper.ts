import { SWRGlobalState } from './global-state'
import type { Key, Cache, State, GlobalState } from '../types'

export const noop = () => {}

// Using noop() as the undefined value as undefined can possibly be replaced
// by something else. Prettier ignore and extra parentheses are necessary here
// to ensure that tsc doesn't remove the __NOINLINE__ comment.
// prettier-ignore
export const UNDEFINED = (/*#__NOINLINE__*/ noop()) as undefined

export const OBJECT = Object

export const isUndefined = (v: any): v is undefined => v === UNDEFINED
export const isFunction = <
  T extends (...args: any[]) => any = (...args: any[]) => any
>(
  v: unknown
): v is T => typeof v == 'function'
export const mergeObjects = (a: any, b: any) => OBJECT.assign({}, a, b)
export const isEmptyCacheState = (v: State<any, any>): boolean => {
  const keys = Object.keys(v)
  return keys.length === 1 && keys[0] === 'key'
}

const STR_UNDEFINED = 'undefined'

// NOTE: Use function to guarantee it's re-evaluated between jsdom and node runtime for tests.
export const isWindowDefined = typeof window != STR_UNDEFINED
export const isDocumentDefined = typeof document != STR_UNDEFINED
export const hasRequestAnimationFrame = () =>
  isWindowDefined && typeof window['requestAnimationFrame'] != STR_UNDEFINED

export const createCacheHelper = <Data = any, T = State<Data, any>>(
  cache: Cache,
  key: Key
) => {
  const state = SWRGlobalState.get(cache) as GlobalState
  const emptyCache = { key }
  return [
    // Getter
    () => (cache.get(key) || emptyCache) as T,
    // Setter
    (info: T) => {
      const prev = cache.get(key) || emptyCache
      state[5](key as string, mergeObjects(prev, info), prev)
    },
    // Subscriber
    state[6]
  ] as const
}
