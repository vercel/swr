import { defaultConfigOptions } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED, isUndefined } from './helper'
import { internalMutate } from './mutate'
import { SWRGlobalState } from './global-state'

import {
  Cache,
  ScopedMutator,
  RevalidateCallback,
  ConfigOptions,
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
  options?: Partial<ConfigOptions>
): [Cache<Data>, ScopedMutator<Data>] {
  const opts = { ...defaultConfigOptions, ...options }
  const fallbackValues = opts.fallbackValues

  // The global state for a specific provider will be used to deduplicate
  // requests and store listeners. As well as a mutate function that bound to
  // the cache.

  // Provider's gloabl state might be already initialized. Let's try to get the
  // global state assoicated with the provider first.
  const existingGloablState = SWRGlobalState.get(provider)

  // If the initializer returns the parent provider with some fallback values,
  // we need to override its `get` method.
  if (fallbackValues) {
    const originalProviderGet = provider.get.bind(provider)

    // Override the provider.
    // Since this is just a fallback layer, we shouldn't create any new states
    // or mutate functions for it. Instead we just set the original provider's
    // state to this new object.
    // Note that `SWRGlobalState` is a WeakMap, when a rerender happens, the
    // previous provider object won't have any reference and will be GC'd. It
    // won't cause any memory leaks.
    provider = {
      set: provider.set.bind(provider),
      get: (key: string) => {
        const value = originalProviderGet(key)
        if (isUndefined(value)) return fallbackValues[key]
        return value
      },
      delete: provider.delete.bind(provider)
    }
  }

  // If there's no global state bound to the provider, create a new one with the
  // new mutate function.
  const globalState = existingGloablState || [
    {},
    {},
    {},
    {},
    {},
    {},
    // This has to be called after the `fallbackValues` check above, since that
    // might override the provider object.
    internalMutate.bind(UNDEFINED, provider) as ScopedMutator<Data>
  ]

  // Get some parts of the global state for initialization use.
  const EVENT_REVALIDATORS = globalState[0]
  const mutate = globalState[6]

  // Update the state if it's new, or the provider has been extended.
  if (!existingGloablState || fallbackValues) {
    SWRGlobalState.set(provider, globalState)
  }

  // This is a new provider, we need to initialize it and setup DOM events
  // listeners for `focus` and `reconnect` actions.
  if (!existingGloablState && !IS_SERVER) {
    opts.initFocus(
      revalidateAllKeys.bind(
        UNDEFINED,
        EVENT_REVALIDATORS,
        RevalidateEvent.FOCUS_EVENT
      )
    )
    opts.initReconnect(
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
  return [provider, mutate]
}
