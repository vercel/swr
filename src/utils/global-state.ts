import {
  Cache,
  ScopedMutator,
  RevalidateCallback
} from '../types'

export type GlobalState = [
  Record<string, RevalidateCallback[]>, // EVENT_REVALIDATORS
  Record<string, [number, number]>, // MUTATION: [ts, end_ts]
  Record<string, [any, number]>, // FETCH: [data, ts]
  ScopedMutator, // Mutator
  (key: string, value: any, prev: any) => void, // Setter
  (key: string, callback: (current: any, prev: any) => void) => () => void // Subscriber
]

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()
