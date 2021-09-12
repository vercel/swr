import { useCallback, useRef } from 'react'
import useSWR, { Middleware, SWRHook, useSWRConfig } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'

export const mutation: Middleware = () => (key, fetcher, config) => {
  const [serializedKey, args] = serialize(key)
  const argsRef = useRef(args)
  const { mutate } = useSWRConfig()

  const [stateRef, stateDependencies, setState] = useStateWithDeps({
    data: undefined,
    error: undefined,
    isMutating: false
  })

  const trigger = useCallback((extraArg, shouldRevalidate, opts) => {
    // Trigger a mutation.
    // Assign extra arguments to the ref, so the fetcher can access them later.
    return mutate(serializedKey, () => fetcher(...argsRef.current, extraArg), {
      revalidate: shouldRevalidate,
      populateCache: false
    })
  }, [])

  return {
    mutate,
    trigger,
    get data() {
      stateDependencies.data = true
      return stateRef.current.data
    },
    get error() {
      stateDependencies.error = true
      return stateRef.current.error
    },
    get isValidating() {
      ;(stateDependencies as any).isMutating = true
      return stateRef.current.isMutating
    }
  }
}

export default withMiddleware(useSWR as SWRHook, mutation)
