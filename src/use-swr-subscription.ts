import { useEffect } from 'react'
import useSWR from './use-swr'
import { keyInterface, ConfigInterface } from './types'

type SWRSubscription<Data, Error> = (
  key: keyInterface,
  callbacks: {
    onData(data: Data): void
    onError(err: Error): void
  }
) => void

type SWRSubscriptionResponse<Data, Error> = {
  data?: Data
  error?: Error
}

const subscriptions = new Map<keyInterface, number>()
const disposers = new Map()

function useSWRSubscription<Data = any, Error = any>(
  key: keyInterface,
  subscribe: SWRSubscription<Data, Error>
): SWRSubscriptionResponse<Data, Error>
function useSWRSubscription<Data = any, Error = any>(
  key: keyInterface,
  subscribe: SWRSubscription<Data, Error>,
  config?: ConfigInterface<Data, Error>
): SWRSubscriptionResponse<Data, Error> {
  const { data, error, mutate } = useSWR(key, null, config)

  useEffect(() => {
    subscriptions.set(key, (subscriptions.get(key) || 0) + 1)
    const onData = val => mutate(val, false)
    const onError = err => {
      mutate(() => {
        throw err
      }, false)
    }

    if (subscriptions.get(key) === 1) {
      const dispose = subscribe(key, { onData, onError })
      disposers.set(key, dispose)
    }
    return () => {
      subscriptions.set(key, subscriptions.get(key) - 1)
      if (subscriptions.get(key) === 0) {
        disposers.get(key)()
      }
    }
  }, [key])

  return { data, error }
}

export { useSWRSubscription, SWRSubscription, SWRSubscriptionResponse }
