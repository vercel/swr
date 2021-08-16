import { provider as defaultProvider } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED } from './helper'
import { FOCUS_EVENT, RECONNECT_EVENT } from './revalidate-types'

import {
  Cache,
  Revalidator,
  EventRevalidator,
  Updater,
  ProviderOptions
} from '../types'

export type GlobalState = [
  Record<string, EventRevalidator[]>, // EVENT_REVALIDATORS
  Record<string, (Revalidator | Updater<any>)[]>, // STATE_REVALIDATORS
  Record<string, number>, // MUTATION_TS
  Record<string, number>, // MUTATION_END_TS
  Record<string, any>, // CONCURRENT_PROMISES
  Record<string, number> // CONCURRENT_PROMISES_TS
]

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()

function revalidateAllKeys(
  revalidators: Record<string, EventRevalidator[]>,
  type: number
) {
  for (const key in revalidators) {
    if (revalidators[key][0]) revalidators[key][0](type)
  }
}

function setupGlobalEvents(cache: Cache, options: ProviderOptions) {
  const [EVENT_REVALIDATORS] = SWRGlobalState.get(cache) as GlobalState
  options.setupOnFocus(
    revalidateAllKeys.bind(UNDEFINED, EVENT_REVALIDATORS, FOCUS_EVENT)
  )
  options.setupOnReconnect(
    revalidateAllKeys.bind(UNDEFINED, EVENT_REVALIDATORS, RECONNECT_EVENT)
  )
}

export function wrapCache<Data = any>(
  provider: Cache<Data>,
  options?: Partial<ProviderOptions>
): Cache<Data> {
  // Initialize global state for the specific data storage that will be used to
  // deduplicate requests and store listeners.
  SWRGlobalState.set(provider, [{}, {}, {}, {}, {}, {}])

  // Setup DOM events listeners for `focus` and `reconnect` actions.
  if (!IS_SERVER) {
    setupGlobalEvents(provider, { ...defaultProvider, ...options })
  }

  // We might want to inject an extra layer on top of `provider` in the future,
  // such as key serialization, auto GC, etc.
  // For now, it's just a `Map` interface without any modifications.
  return provider
}
