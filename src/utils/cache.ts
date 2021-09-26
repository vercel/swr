import { defaultConfigOptions } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED, mergeObjects, noop } from './helper'
import { internalMutate } from './mutate'
import { SWRGlobalState } from './global-state'
import * as revalidateEvents from '../constants/revalidate-events'
import { RevalidateEvent } from '../types'

import {
  Cache,
  ScopedMutator,
  RevalidateCallback,
  ProviderConfiguration
} from '../types'

const revalidateAllKeys = (
  revalidators: Record<string, RevalidateCallback[]>,
  type: RevalidateEvent
) => {
  for (const key in revalidators) {
    if (revalidators[key][0]) revalidators[key][0](type)
  }
}

export const initCache = <Data = any>(
  provider: Cache<Data>,
  options?: Partial<ProviderConfiguration>
): [Cache<Data>, ScopedMutator<Data>, () => void] | undefined => {
  // The global state for a specific provider will be used to deduplicate
  // requests and store listeners. As well as a mutate function that bound to
  // the cache.

  // Provider's gloabl state might be already initialized. Let's try to get the
  // global state associated with the provider first.
  if (!SWRGlobalState.has(provider)) {
    const opts = mergeObjects(defaultConfigOptions, options)

    // If there's no global state bound to the provider, create a new one with the
    // new mutate function.
    const EVENT_REVALIDATORS = {}
    const mutate = internalMutate.bind(UNDEFINED, provider) as ScopedMutator<
      Data
    >
    let unsubscribe = noop

    // Update the state if it's new, or the provider has been extended.
    SWRGlobalState.set(provider, [
      EVENT_REVALIDATORS,
      {},
      {},
      {},
      {},
      {},
      mutate
    ])

    // This is a new provider, we need to initialize it and setup DOM events
    // listeners for `focus` and `reconnect` actions.
    if (!IS_SERVER) {
      const releaseFocus = opts.initFocus(
        revalidateAllKeys.bind(
          UNDEFINED,
          EVENT_REVALIDATORS,
          revalidateEvents.FOCUS_EVENT
        )
      )
      const releaseReconnect = opts.initReconnect(
        revalidateAllKeys.bind(
          UNDEFINED,
          EVENT_REVALIDATORS,
          revalidateEvents.RECONNECT_EVENT
        )
      )
      unsubscribe = () => {
        releaseFocus && releaseFocus()
        releaseReconnect && releaseReconnect()
      }
    }

    // We might want to inject an extra layer on top of `provider` in the future,
    // such as key serialization, auto GC, etc.
    // For now, it's just a `Map` interface without any modifications.
    return [provider, mutate, unsubscribe]
  }
}
