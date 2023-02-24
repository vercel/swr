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
) => void

export type SWRSubscriptionResponse<Data = any, Error = any> = {
  data?: Data
  error?: Error
}

export type SWRSubscriptionHook<Data = any, Error = any> = (
  key: Key,
  subscribe: SWRSubscription<Data, Error>,
  config?: SWRConfiguration
) => SWRSubscriptionResponse<Data, Error>

const subscriptions = new Map<Key, number>()
const disposers = new Map()

export const subscription = (<Data, Error>(useSWRNext: SWRHook) =>
  (
    _key: Key,
    subscribe: SWRSubscription<Data, Error>,
    config: SWRConfiguration & typeof SWRConfig.defaultValue
  ): SWRSubscriptionResponse<Data, Error> => {
    const [key] = serialize(_key)
    const swr = useSWRNext(key, null, config)
    const subscribeRef = useRef(subscribe)

    useIsomorphicLayoutEffect(() => {
      subscribeRef.current = subscribe
    })

    const { cache } = config
    const [, set] = createCacheHelper<Data>(cache, key)

    useIsomorphicLayoutEffect(() => {
      subscriptions.set(key, (subscriptions.get(key) || 0) + 1)

      const onData = (val?: Data) => swr.mutate(val, false)
      const onError = async (err: any) => set({ error: err })

      const next = (err_?: any, data_?: Data) => {
        if (err_) onError(err_)
        else onData(data_)
      }

      if (subscriptions.get(key) === 1) {
        const dispose = subscribeRef.current(key, { next })
        disposers.set(key, dispose)
      }
      return () => {
        // Prevent frequent unsubscribe caused by unmount
        setTimeout(() => {
          const count = subscriptions.get(key) || 1
          subscriptions.set(key, count - 1)
          // Dispose if it's last one
          if (count === 1) {
            disposers.get(key)()
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
 * @experimental This API is experimental and might change in the future.
 */
const useSWRSubscription = withMiddleware(
  useSWR,
  subscription
) as SWRSubscriptionHook

export default useSWRSubscription
