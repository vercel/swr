import { useEffect } from 'react'
import useSWR from 'swr'
import { withMiddleware } from '../src/utils/with-middleware'
import { Key, SWRHook, Middleware, SWRConfiguration } from '../src/types'

export type SWRSubscription<Data = any, Error = any> = (
  key: Key,
  callbacks: {
    onData(data: Data): void
    onError(err: Error): void
  }
) => void

export type SWRSubscriptionResponse<Data = any, Error = any> = {
  data?: Data
  error?: Error
}

export type SWRSubscriptionHook<Data = any, Error = any> = (
  key: Key,
  subscribeFn: SWRSubscription<Data, Error>,
  config?: SWRConfiguration
) => SWRSubscriptionResponse<Data, Error>

const subscriptions = new Map<Key, number>()
const disposers = new Map()

export const subscribe = (<Data, Error>(useSWRNext: SWRHook) =>
  (
    key: Key,
    subscribeFn: SWRSubscription<Data, Error>,
    config?: SWRConfiguration
  ): SWRSubscriptionResponse<Data, Error> => {
    const { data, error, mutate } = useSWRNext(key, null, config)

    useEffect(() => {
      subscriptions.set(key, (subscriptions.get(key) || 0) + 1)
      const onData = (val: Data) => mutate(val, false)
      const onError = async (err: any) => {
        // Avoid thrown errors from `mutate`
        // eslint-disable-next-line no-empty
        try {
          await mutate(() => {
            throw err
          }, false)
        } catch (_) {
          /* eslint-disable-line no-empty */
        }
      }

      if (subscriptions.get(key) === 1) {
        const dispose = subscribeFn(key, { onData, onError })
        disposers.set(key, dispose)
      }
      return () => {
        const count = subscriptions.get(key) || 1
        subscriptions.set(key, count - 1)
        // dispose if it's last one
        if (count === 1) {
          disposers.get(key)()
        }
      }
    }, [key, mutate, subscribeFn])

    return { data, error }
  }) as Middleware

const useSWRSubscribe = withMiddleware(useSWR, subscribe) as SWRSubscriptionHook

export { useSWRSubscribe as unstable_useSWRSubscribe }
