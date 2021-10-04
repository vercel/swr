import { useCallback, useRef } from 'react'
import useSWR, { useSWRConfig, Middleware, Key } from 'swr'

import { serialize } from '../src/utils/serialize'
import { useStateWithDeps } from '../src/utils/state'
import { withMiddleware } from '../src/utils/with-middleware'
import { useIsomorphicLayoutEffect } from '../src/utils/env'
import { UNDEFINED } from '../src/utils/helper'
import { getTimestamp } from '../src/utils/timestamp'

import {
  SWRMutationConfiguration,
  SWRMutationResponse,
  SWRMutationHook,
  MutationFetcher
} from './types'

const mutation = <Data, Error>() => (
  key: Key,
  fetcher: MutationFetcher<Data>,
  config: SWRMutationConfiguration<Data, Error> = {}
) => {
  const { mutate } = useSWRConfig()

  const keyRef = useRef(key)
  // Ditch all mutation results that happened earlier than this timestamp.
  const ditchMutationsTilRef = useRef(0)

  const [stateRef, stateDependencies, setState] = useStateWithDeps<Data, Error>(
    {
      data: UNDEFINED,
      error: UNDEFINED,
      isValidating: false
    },
    true
  )
  const currentState = stateRef.current

  // Similar to the global mutate, but bound to the current cache and key.
  // `cache` isn't allowed to change during the lifecycle.
  const boundMutate = useCallback(
    (newData, shouldRevalidate) => {
      const serializedKey = serialize(keyRef.current)[0]
      return mutate(serializedKey, newData, shouldRevalidate)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const trigger = useCallback(async (extraArg, opts) => {
    if (!fetcher) {
      throw new Error('Can’t trigger the mutation: missing fetcher.')
    }

    const [serializedKey, args] = serialize(keyRef.current)

    // Disable cache population by default.
    const options = Object.assign({ populateCache: false }, config, opts)

    // Trigger a mutation, also track the timestamp. Any mutation that happened
    // earlier this timestamp should be ignored.
    const mutationStartedAt = getTimestamp()
    ditchMutationsTilRef.current = mutationStartedAt

    try {
      setState({ isValidating: true })
      args.push(extraArg)
      const data = await mutate(serializedKey, fetcher(...args), options)

      // If it's reset after the mutation, we don't broadcast any state change.
      if (ditchMutationsTilRef.current <= mutationStartedAt) {
        setState({ data, isValidating: false })
        options.onSuccess && options.onSuccess(data, serializedKey, options)
      }
      return data
    } catch (error) {
      // If it's reset after the mutation, we don't broadcast any state change.
      if (ditchMutationsTilRef.current <= mutationStartedAt) {
        setState({ error: error as Error, isValidating: false })
        options.onError && options.onError(error, serializedKey, options)
      }
      throw error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = useCallback(() => {
    ditchMutationsTilRef.current = getTimestamp()
    setState({ data: UNDEFINED, error: UNDEFINED, isValidating: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useIsomorphicLayoutEffect(() => {
    keyRef.current = key
  })

  return {
    mutate: boundMutate,
    trigger,
    reset,
    get data() {
      stateDependencies.data = true
      return currentState.data
    },
    get error() {
      stateDependencies.error = true
      return currentState.error
    },
    get isMutating() {
      stateDependencies.isValidating = true
      return currentState.isValidating
    }
  }
}

export default (withMiddleware(
  useSWR,
  (mutation as unknown) as Middleware
) as unknown) as SWRMutationHook

export { SWRMutationConfiguration, SWRMutationResponse }
