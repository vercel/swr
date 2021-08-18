import { provider as defaultProvider } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED } from './helper'

import {
  Cache,
  RevalidateCallback,
  StateUpdateCallback,
  ProviderOptions,
  RevalidateEvent
} from '../types'

export type GlobalState = [
  Record<string, RevalidateCallback[]>, // EVENT_REVALIDATORS
  Record<string, StateUpdateCallback[]>, // STATE_UPDATERS
  Record<string, number>, // MUTATION_TS
  Record<string, number>, // MUTATION_END_TS
  Record<string, any>, // CONCURRENT_PROMISES
  Record<string, number> // CONCURRENT_PROMISES_TS
]

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()

function revalidateAllKeys(
  revalidators: Record<string, RevalidateCallback[]>,
  type: RevalidateEvent
) {
  for (const key in revalidators) {
    if (revalidators[key][0]) revalidators[key][0](type)
  }
}

export function wrapCache<Data = any>(
  provider: Cache<Data>,
  options?: Partial<ProviderOptions>
): Cache<Data> {
  const EVENT_REVALIDATORS = {}
  const opts = { ...defaultProvider, ...options }

  // Initialize global state for the specific data storage that will be used to
  // deduplicate requests and store listeners.
  SWRGlobalState.set(provider, [EVENT_REVALIDATORS, {}, {}, {}, {}, {}])

  // Setup DOM events listeners for `focus` and `reconnect` actions.
  if (!IS_SERVER) {
    opts.setupOnFocus(
      revalidateAllKeys.bind(
        UNDEFINED,
        EVENT_REVALIDATORS,
        RevalidateEvent.FOCUS_EVENT
      )
    )
    opts.setupOnReconnect(
      revalidateAllKeys.bind(
        UNDEFINED,
        EVENT_REVALIDATORS,
        RevalidateEvent.RECONNECT_EVENT
      )
    )
  }

  // We might want to inject an extra layer on top of `provider` in the future,
  // such as key serialization, auto GC, etc.
  // For now, it's just a `Map` interface without any modifications.
  return provider
}
