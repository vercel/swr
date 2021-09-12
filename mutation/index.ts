import { useCallback } from 'react'
import useSWR, { Middleware, SWRHook } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'

export const mutation: Middleware = useSWRNext => (key, fetcher, config) => {
  // Override all revalidate options, disable polling, disable cache write back
  // by default.
  config.revalidateOnFocus = false
  config.revalidateOnMount = false
  config.revalidateOnReconnect = false
  config.refreshInterval = 0
  config.populateCache = false
  config.shouldRetryOnError = false
  config.local = true

  const [dataKey, args] = serialize(key)
  const swr = useSWRNext(key, fetcher, config)

  const [stateRef, stateDependencies, setState] = useStateWithDeps({
    data: undefined,
    error: undefined,
    isValidating: false
  })

  const trigger = useCallback((extraArg, opts) => {
    fetcher(...args, extraArg)
  }, [])

  return {
    mutate: swr.mutate,
    get data() {
      stateDependencies.data = true
      return stateRef.current.data
    },
    get error() {
      stateDependencies.error = true
      return stateRef.current.error
    },
    get isValidating() {
      stateDependencies.isValidating = true
      return stateRef.current.isValidating
    }
  }
}

export default withMiddleware(useSWR as SWRHook, mutation)
