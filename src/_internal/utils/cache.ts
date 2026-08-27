import { defaultConfigOptions } from './web-preset'
import { IS_SERVER } from './env'
import { UNDEFINED, mergeObjects, noop } from './shared'
import { internalMutate } from './mutate'
import { SWRGlobalState } from './global-state'
import { getTimestamp } from './timestamp'
import * as revalidateEvents from '../events'

import type {
  Cache,
  ScopedMutator,
  RevalidateEvent,
  RevalidateCallback,
  ProviderConfiguration,
  GlobalState,
  Unloader
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
):
  | [Cache<Data>, ScopedMutator, () => void, () => void, Unloader]
  | [Cache<Data>, ScopedMutator, undefined, undefined, Unloader]
  | undefined => {
  // The global state for a specific provider will be used to deduplicate
  // requests and store listeners. As well as a mutate function that is bound to
  // the cache.

  // The provider's global state might be already initialized. Let's try to get the
  // global state associated with the provider first.
  if (!SWRGlobalState.has(provider)) {
    const opts = mergeObjects(defaultConfigOptions, options)

    // If there's no global state bound to the provider, create a new one with the
    // new mutate function.
    const EVENT_REVALIDATORS = Object.create(null)

    const mutate = internalMutate.bind(UNDEFINED, provider) as ScopedMutator
    let unmount = noop

    const subscriptions: Record<string, ((current: any, prev: any) => void)[]> =
      Object.create(null)
    const subscribe = (
      key: string,
      callback: (current: any, prev: any) => void
    ) => {
      const subs = subscriptions[key] || []
      subscriptions[key] = subs

      subs.push(callback)
      return () => {
        const index = subs.indexOf(callback)
        if (index >= 0) {
          // O(1): swap with the last element and pop
          subs[index] = subs[subs.length - 1]
          subs.pop()
        }
      }
    }
    const setter = (key: string, value: any, prev: any) => {
      provider.set(key, value)
      const subs = subscriptions[key]
      if (subs) {
        for (const fn of subs) {
          fn(value, prev)
        }
      }
    }

    const unload: Unloader = unloadOptions => {
      const state = SWRGlobalState.get(provider) as GlobalState
      const [, MUTATION, FETCH, PRELOAD] = state
      const ts = getTimestamp()

      // Bump the unload generation so in-flight writes that bypass the
      // request markers (e.g. `useSWRInfinite` page responses) know to
      // discard themselves when they resolve.
      state[8]++

      // Invalidate all in-flight requests and mutations first, so nothing
      // that resolves after this point can write back to the cache: fetches
      // fail the concurrent request marker check, and mutations fail the
      // timestamp race check. Mutation timestamps are overwritten instead of
      // deleted because ongoing mutations read them on resolution.
      for (const key in FETCH) delete FETCH[key]
      for (const key in PRELOAD) delete PRELOAD[key]
      for (const key in MUTATION) MUTATION[key] = [ts, ts]

      // Delete all entries — including the special `useSWRInfinite` and
      // `useSWRSubscription` keys — and notify the subscribers of each key
      // so mounted hooks re-render with the empty cache. Subscribers receive
      // the same empty state object that cache reads resolve to for missing
      // entries.
      const emptyState = {}
      for (const key of [...provider.keys()]) {
        const prev = provider.get(key)
        provider.delete(key)
        const subs = subscriptions[key]
        if (subs) {
          for (const fn of subs) {
            fn(emptyState, prev)
          }
        }
      }

      // The unload event runs last so the fresh requests it may start are
      // not invalidated by the cleanup above. It always fires — even without
      // revalidation — and to every hook on the key, so each one can drop
      // the previous data kept by `keepPreviousData`. Only the first hook
      // revalidates, consistent with how mutations revalidate a key.
      const revalidate = !unloadOptions || unloadOptions.revalidate !== false
      for (const key in EVENT_REVALIDATORS) {
        const revalidators = EVENT_REVALIDATORS[key]
        for (let i = 0; i < revalidators.length; i++) {
          revalidators[i](revalidateEvents.UNLOAD_EVENT, {
            revalidate: revalidate && !i
          })
        }
      }
    }

    const initProvider = () => {
      if (!SWRGlobalState.has(provider)) {
        // Update the state if it's new, or if the provider has been extended.
        SWRGlobalState.set(provider, [
          EVENT_REVALIDATORS,
          Object.create(null),
          Object.create(null),
          Object.create(null),
          mutate,
          setter,
          subscribe,
          unload,
          0
        ])
        if (!IS_SERVER) {
          // When listening to the native events for auto revalidations,
          // we intentionally put a delay (setTimeout) here to make sure they are
          // fired after immediate JavaScript executions, which can be
          // React's state updates.
          // This avoids some unnecessary revalidations such as
          // https://github.com/vercel/swr/issues/1680.
          const releaseFocus = opts.initFocus(
            setTimeout.bind(
              UNDEFINED,
              revalidateAllKeys.bind(
                UNDEFINED,
                EVENT_REVALIDATORS,
                revalidateEvents.FOCUS_EVENT
              )
            )
          )
          const releaseReconnect = opts.initReconnect(
            setTimeout.bind(
              UNDEFINED,
              revalidateAllKeys.bind(
                UNDEFINED,
                EVENT_REVALIDATORS,
                revalidateEvents.RECONNECT_EVENT
              )
            )
          )
          unmount = () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            releaseFocus && releaseFocus()
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            releaseReconnect && releaseReconnect()
            // When un-mounting, we need to remove the cache provider from the state
            // storage too because it's a side-effect. Otherwise, when re-mounting we
            // will not re-register those event listeners.
            SWRGlobalState.delete(provider)
          }
        }
      }
    }
    initProvider()

    // This is a new provider, we need to initialize it and setup DOM events
    // listeners for `focus` and `reconnect` actions.

    // We might want to inject an extra layer on top of `provider` in the future,
    // such as key serialization, auto GC, etc.
    // For now, it's just a `Map` interface without any modifications.
    return [provider, mutate, initProvider, unmount, unload]
  }

  const state = SWRGlobalState.get(provider) as GlobalState
  return [provider, state[4], UNDEFINED, UNDEFINED, state[7]]
}
