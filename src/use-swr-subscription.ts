import { useEffect } from 'react'
import useSWR from './use-swr'
import {
  Key,
  SWRConfiguration,
  SWRSubscription,
  SWRSubscriptionResponse
} from './types'

const subscriptions = new Map<Key, number>()
const disposers = new Map()

function useSWRSubscription<Data = any, Error = any>(
  key: Key,
  subscribe: SWRSubscription<Data, Error>
): SWRSubscriptionResponse<Data, Error>
function useSWRSubscription<Data = any, Error = any>(
  key: Key,
  subscribe: SWRSubscription<Data, Error>,
  config?: SWRConfiguration<Data, Error>
): SWRSubscriptionResponse<Data, Error> {
  const { data, error, mutate } = useSWR(key, null, config)

  useEffect(() => {
    subscriptions.set(key, (subscriptions.get(key) || 0) + 1)
    const onData = (val: Data) => mutate(val, false)
    const onError = (err: any) => {
      mutate(() => {
        throw err
      }, false)
    }

    if (subscriptions.get(key) === 1) {
      const dispose = subscribe(key, { onData, onError })
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
}

export { useSWRSubscription, SWRSubscription, SWRSubscriptionResponse }
