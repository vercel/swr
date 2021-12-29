import {
  Cache,
  ScopedMutator,
  RevalidateCallback,
  StateUpdateCallback
} from '../types'

export type GlobalState = [
  Record<string, RevalidateCallback[]>, // EVENT_REVALIDATORS
  Record<string, StateUpdateCallback[]>, // STATE_UPDATERS
  Record<string, [number, number]>, // MUTATION: [ts, end_ts]
  Record<string, [any, number]>, // FETCH: [data, ts]
  ScopedMutator // Mutator
]

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()
