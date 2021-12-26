import {
  Cache,
  ScopedMutator,
  RevalidateCallback,
  StateUpdateCallback
} from '../types'

export type GlobalState = [
  Record<string, RevalidateCallback[]>, // EVENT_REVALIDATORS
  Record<string, StateUpdateCallback[]>, // STATE_UPDATERS
  Record<string, number>, // MUTATION_TS
  Record<string, number>, // MUTATION_END_TS
  Record<string, [any, number]>, // CONCURRENT_REQUESTS: [data, ts]
  ScopedMutator // Mutator
]

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()
