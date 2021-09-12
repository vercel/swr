import { useCallback, useRef } from 'react'
import useSWR, { Middleware, Key, Fetcher, useSWRConfig } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'
import { useIsomorphicLayoutEffect } from '../src/utils/env'
import { isUndefined, UNDEFINED } from '../src/utils/helper'

import { SWRMutationConfiguration, SWRMutationResponse } from './types'

const mutation = <Data, Error>() => (
  key: Key,
  fetcher: Fetcher<Data>,
  config: SWRMutationConfiguration<Data, Error> = {}
) => {
  const keyRef = useRef(key)
  const { mutate } = useSWRConfig()

  const [stateRef, stateDependencies, setState] = useStateWithDeps<Data, Error>(
    {
      data: undefined,
      error: undefined,
      isValidating: false
    },
    true
  )

  const trigger = useCallback(async (extraArg, opts) => {
    if (!fetcher)
      throw new Error('Can’t trigger the mutation: missing fetcher.')

    const [serializedKey, args] = serialize(keyRef.current)
    const options = Object.assign({}, config, opts)

    // Disable cache population by default.
    if (isUndefined(options.populateCache)) {
      options.populateCache = false
    }

    // Trigger a mutation.
    // Assign extra arguments to the ref, so the fetcher can access them later.
    try {
      setState({ isValidating: true })
      args.push(extraArg)
      const data = await mutate(
        serializedKey,
        fetcher.apply(UNDEFINED, args),
        options
      )
      setState({ data, isValidating: false })
      options.onSuccess && options.onSuccess(data, serializedKey, options)
      return data
    } catch (error) {
      setState({ error, isValidating: false })
      options.onError && options.onError(error, serializedKey, options)
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: undefined, error: undefined, isValidating: false })
  }, [])

  useIsomorphicLayoutEffect(() => {
    keyRef.current = key
  })

  return {
    mutate,
    trigger,
    reset,
    get data() {
      stateDependencies.data = true
      return stateRef.current.data
    },
    get error() {
      stateDependencies.error = true
      return stateRef.current.error
    },
    get isMutating() {
      stateDependencies.isValidating = true
      return stateRef.current.isValidating
    }
  } as SWRMutationResponse<Data, Error>
}

type SWRMutationHook = <Data = any, Error = any>(
  ...args:
    | readonly [Key, Fetcher<Data>]
    | readonly [Key, Fetcher<Data>, SWRMutationConfiguration<Data, Error>]
) => SWRMutationResponse<Data, Error>

export default (withMiddleware(
  useSWR,
  (mutation as unknown) as Middleware
) as unknown) as SWRMutationHook

export { SWRMutationConfiguration, SWRMutationResponse }
