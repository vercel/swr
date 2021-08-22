import { provider as defaultProvider } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED } from './helper'
import { internalMutate } from './mutate'
import { SWRGlobalState } from './global-state'

import {
  Cache,
  ScopedMutator,
  RevalidateCallback,
  ProviderOptions,
  RevalidateEvent
} from '../types'

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
) {
  const EVENT_REVALIDATORS = {}
  const opts = { ...defaultProvider, ...options }

  // Also create the mutate function that bound to the cache.
  const mutate = internalMutate.bind(UNDEFINED, provider) as ScopedMutator<Data>

  // Initialize global state for the specific data storage that will be used to
  // deduplicate requests and store listeners.
  SWRGlobalState.set(provider, [EVENT_REVALIDATORS, {}, {}, {}, {}, {}, mutate])

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
  return {
    cache: provider,
    mutate
  }
}
