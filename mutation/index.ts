import { useCallback, useRef } from 'react'
import useSWR, { Middleware, SWRHook, useSWRConfig } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'

export const mutation: Middleware = <Data, Error>() => (
  key,
  fetcher,
  config
) => {
  const [serializedKey, args] = serialize(key)
  const argsRef = useRef(args)
  const { mutate } = useSWRConfig()

  const [stateRef, stateDependencies, setState] = useStateWithDeps<Data, Error>(
    {
      data: undefined,
      error: undefined,
      isValidating: false
    }
  )

  const trigger = useCallback(async (extraArg, shouldRevalidate, opts) => {
    // Trigger a mutation.
    // Assign extra arguments to the ref, so the fetcher can access them later.
    try {
      setState({ isValidating: true })
      const data = await mutate(
        serializedKey,
        () => fetcher(...argsRef.current, extraArg),
        {
          revalidate: shouldRevalidate,
          populateCache: false
        }
      )
      setState({ data, isValidating: false })
      return data
    } catch (error) {
      setState({ error, isValidating: false })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: undefined, error: undefined, isValidating: false })
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
    get isMutating() {
      ;(stateDependencies as any).isValidating = true
      return stateRef.current.isValidating
    }
  }
}

export default withMiddleware(useSWR as SWRHook, mutation)
