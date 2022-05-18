import { useRef } from 'react'
import useSWR from 'swr'
import {
  withMiddleware,
  Key,
  SWRHook,
  Middleware,
  serialize,
  SWRConfiguration,
  useIsomorphicLayoutEffect
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
    config?: SWRConfiguration
  ): SWRSubscriptionResponse<Data, Error> => {
    const [key] = serialize(_key)
    const swr = useSWRNext(key, null, config)
    const subscribeRef = useRef(subscribe)

    useIsomorphicLayoutEffect(() => {
      subscribeRef.current = subscribe
    })

    useIsomorphicLayoutEffect(() => {
      subscriptions.set(key, (subscriptions.get(key) || 0) + 1)

      const onData = (val?: Data) => swr.mutate(val, false)
      const onError = async (err: any) => {
        // Avoid thrown errors from `mutate`
        // eslint-disable-next-line no-empty
        try {
          await swr.mutate(() => {
            throw err
          }, false)
        } catch (_) {
          /* eslint-disable-line no-empty */
        }
      }

      const next = (_err?: any, _data?: Data) => {
        if (_err) onError(_err)
        else onData(_data)
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

const useSWRSubscription = withMiddleware(
  useSWR,
  subscription
) as SWRSubscriptionHook

export default useSWRSubscription
