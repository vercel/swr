import { useCallback, useRef } from 'react'
import useSWR, { Middleware, Key, Fetcher, useSWRConfig } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'
import { useIsomorphicLayoutEffect } from '../src/utils/env'
import { isUndefined, UNDEFINED } from '../src/utils/helper'
import { getTimestamp } from '../src/utils/timestamp'

import { SWRMutationConfiguration, SWRMutationResponse } from './types'

const DEFAULT_STATE = {
  data: UNDEFINED,
  error: UNDEFINED,
  isValidating: false
}

const mutation = <Data, Error>() => (
  key: Key,
  fetcher: Fetcher<Data>,
  config: SWRMutationConfiguration<Data, Error> = {}
) => {
  const { mutate } = useSWRConfig()

  const keyRef = useRef(key)
  // Ditch all mutation results that happened earlier than this timestamp.
  const ditchMutationsTilRef = useRef(0)

  const [stateRef, stateDependencies, setState] = useStateWithDeps<Data, Error>(
    DEFAULT_STATE,
    true
  )

  const trigger = useCallback(async (extraArg, opts) => {
    if (!fetcher) {
      throw new Error('Can’t trigger the mutation: missing fetcher.')
    }

    const [serializedKey, args] = serialize(keyRef.current)
    const options = Object.assign({}, config, opts)

    // Disable cache population by default.
    if (isUndefined(options.populateCache)) {
      options.populateCache = false
    }

    // Trigger a mutation, also track the timestamp. Any mutation that happened
    // earlier this timestamp should be ignored.
    const mutationStartedAt = getTimestamp()
    ditchMutationsTilRef.current = mutationStartedAt

    try {
      setState({ isValidating: true })
      args.push(extraArg)
      const data = await mutate(
        serializedKey,
        fetcher.apply(UNDEFINED, args),
        options
      )
      // If it's reset after the mutation, we don't broadcast any state change.
      if (ditchMutationsTilRef.current <= mutationStartedAt) {
        setState({ data, isValidating: false })
        options.onSuccess && options.onSuccess(data, serializedKey, options)
      }
      return data
    } catch (error) {
      // If it's reset after the mutation, we don't broadcast any state change.
      if (ditchMutationsTilRef.current <= mutationStartedAt) {
        setState({ error, isValidating: false })
        options.onError && options.onError(error, serializedKey, options)
      }
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    ditchMutationsTilRef.current = getTimestamp()
    setState(DEFAULT_STATE)
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
