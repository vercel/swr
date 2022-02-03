import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { withMiddleware } from '../src/utils/with-middleware'
import { Key, SWRHook, Middleware, SWRConfiguration } from '../src/types'
import { useIsomorphicLayoutEffect } from '../src/utils/env'

export type SWRSubscription<Data = any, Error = any> = (
  key: Key,
  callback: (err?: Error, data?: Data) => void
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
    key: Key,
    subscribe: SWRSubscription<Data, Error>,
    config?: SWRConfiguration
  ): SWRSubscriptionResponse<Data, Error> => {
    const { data, error, mutate } = useSWRNext(key, null, config)

    const subscribeRef = useRef(subscribe)
    const mutateRef = useRef(mutate)

    useIsomorphicLayoutEffect(() => {
      subscribeRef.current = subscribe
      mutateRef.current = mutate
    })

    useEffect(() => {
      subscriptions.set(key, (subscriptions.get(key) || 0) + 1)

      const onData = (val: Data) => mutateRef.current(val, false)
      const onError = async (err: any) => {
        // Avoid thrown errors from `mutate`
        // eslint-disable-next-line no-empty
        try {
          await mutateRef.current(() => {
            throw err
          }, false)
        } catch (_) {
          /* eslint-disable-line no-empty */
        }
      }

      const callback = (_err?: any, _data?: Data) => {
        if (_err) onError(_err)
        else if (typeof _data !== 'undefined') onData(_data)
      }

      if (subscriptions.get(key) === 1) {
        const dispose = subscribeRef.current(key, callback)
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
    }, [key])

    return { data, error }
  }) as Middleware

const useSWRSubscription = withMiddleware(
  useSWR,
  subscription
) as SWRSubscriptionHook

export { useSWRSubscription as unstable_useSWRSubscription }
