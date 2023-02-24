import type { Key, SWRHook, Middleware, SWRConfiguration, SWRConfig } from 'swr'
import { useRef } from 'react'
import useSWR from 'swr'
import {
  withMiddleware,
  serialize,
  useIsomorphicLayoutEffect,
  createCacheHelper
} from 'swr/_internal'

export type SWRSubscription<Data = any, Error = any> = (
  key: Key,
  { next }: { next: (err?: Error, data?: Data) => void }
) => () => void

export type SWRSubscriptionResponse<Data = any, Error = any> = {
  data?: Data
  error?: Error
}

export type SWRSubscriptionHook<Data = any, Error = any> = (
  key: Key,
  subscribe: SWRSubscription<Data, Error>,
  config?: SWRConfiguration
) => SWRSubscriptionResponse<Data, Error>

// [subscription count, disposer]
type SubscriptionStates = [Map<string, number>, Map<string, () => void>]
const subscriptionStorage = new WeakMap<object, SubscriptionStates>()

export const subscription = (<Data, Error>(useSWRNext: SWRHook) =>
  (
    _key: Key,
    subscribe: SWRSubscription<Data, Error>,
    config: SWRConfiguration & typeof SWRConfig.defaultValue
  ): SWRSubscriptionResponse<Data, Error> => {
    const [key] = serialize(_key)
    const swr = useSWRNext(key, null, config)

    // Track the latest subscribe function.
    const subscribeRef = useRef(subscribe)
    useIsomorphicLayoutEffect(() => {
      subscribeRef.current = subscribe
    })

    const { cache } = config
    const [, set] = createCacheHelper<Data>(cache, key)

    // Ensure that the subscription state is scoped by the cache boundary, so
    // you can have multiple SWR zones with subscriptions having the same key.
    const [subscriptions, disposers] = subscriptionStorage.get(config) || [
      new Map<string, number>(),
      new Map<string, () => void>()
    ]

    useIsomorphicLayoutEffect(() => {
      const refCount = subscriptions.get(key) || 0

      const next = (error?: Error | null, data?: Data) => {
        if (error !== null && typeof error !== 'undefined') {
          set({ error })
        } else {
          swr.mutate(data, false)
        }
      }

      if (!refCount) {
        const dispose = subscribeRef.current(key, { next })
        if (typeof dispose !== 'function') {
          throw new Error(
            'The `subscribe` function must return a function to unsubscribe.'
          )
        }
        disposers.set(key, dispose)
      }

      // Increment the ref count.
      subscriptions.set(key, refCount + 1)

      return () => {
        // Prevent frequent unsubscribe caused by unmount
        setTimeout(() => {
          // TODO: Throw error during development if count is undefined.
          const count = subscriptions.get(key)! - 1

          subscriptions.set(key, count)

          // Dispose if it's the last one.
          if (!count) {
            // TODO: Throw error during development if disposer is undefined.
            disposers.get(key)!()
          }
        })
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    return {
      get data() {
        return swr.data
      },
      get error() {
        return swr.error
      }
    }
  }) as unknown as Middleware

/**
 * A hook to subscribe a SWR resource to an external data source for continuous updates.
 * @experimental This API is experimental and might change in the future.
 * @example
 * ```jsx
 * import useSWRSubscription from 'swr/subscription'
 *
 * const { data, error } = useSWRSubscription(key, (key, { next }) => {
 *   const unsubscribe = dataSource.subscribe(key, (err, data) => {
 *     next(err, data)
 *   })
 *   return unsubscribe
 * })
 * ```
 */
const useSWRSubscription = withMiddleware(
  useSWR,
  subscription
) as SWRSubscriptionHook

export default useSWRSubscription
