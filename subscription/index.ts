import type { Key, SWRHook, Middleware, SWRConfiguration, SWRConfig } from 'swr'
import type {
  SWRSubscriptionOptions,
  SWRSubscription,
  SWRSubscriptionResponse,
  SWRSubscriptionHook
} from './types'
import useSWR from 'swr'
import {
  withMiddleware,
  serialize,
  useIsomorphicLayoutEffect,
  createCacheHelper
} from 'swr/_internal'

// [subscription count, disposer]
type SubscriptionStates = [Map<string, number>, Map<string, () => void>]
const subscriptionStorage = new WeakMap<object, SubscriptionStates>()

const SUBSCRIPTION_PREFIX = '$sub$'

export const subscription = (<Data = any, Error = any>(useSWRNext: SWRHook) =>
  (
    _key: Key,
    subscribe: SWRSubscription<any, Data, Error>,
    config: SWRConfiguration & typeof SWRConfig.defaultValue
  ): SWRSubscriptionResponse<Data, Error> => {
    const [key] = serialize(_key)

    // Prefix the key to avoid conflicts with other SWR resources.
    const subscriptionKey = key ? SUBSCRIPTION_PREFIX + key : undefined
    const swr = useSWRNext(subscriptionKey, null, config)

    const { cache } = config

    // Ensure that the subscription state is scoped by the cache boundary, so
    // you can have multiple SWR zones with subscriptions having the same key.
    if (!subscriptionStorage.has(cache)) {
      subscriptionStorage.set(cache, [
        new Map<string, number>(),
        new Map<string, () => void>()
      ])
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [subscriptions, disposers] = subscriptionStorage.get(cache)!

    useIsomorphicLayoutEffect(() => {
      if (!subscriptionKey) return

      const [, set] = createCacheHelper<Data>(cache, subscriptionKey)
      const refCount = subscriptions.get(subscriptionKey) || 0

      const next = (error?: Error | null, data?: Data) => {
        if (error !== null && typeof error !== 'undefined') {
          set({ error })
        } else {
          set({ error: undefined })
          swr.mutate(data, false)
        }
      }

      // Increment the ref count.
      subscriptions.set(subscriptionKey, refCount + 1)

      if (!refCount) {
        const dispose = subscribe(key, { next })
        if (typeof dispose !== 'function') {
          throw new Error(
            'The `subscribe` function must return a function to unsubscribe.'
          )
        }
        disposers.set(subscriptionKey, dispose)
      }

      return () => {
        // Prevent frequent unsubscribe caused by unmount
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const count = subscriptions.get(subscriptionKey)! - 1

          subscriptions.set(subscriptionKey, count)

          // Dispose if it's the last one.
          if (!count) {
            const dispose = disposers.get(subscriptionKey)
            dispose?.()
          }
        })
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionKey])

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

export type {
  SWRSubscription,
  SWRSubscriptionOptions,
  SWRSubscriptionResponse,
  SWRSubscriptionHook
}
