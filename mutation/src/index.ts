import { useCallback, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import type { Middleware, Key } from 'swr/_internal'
import { useStateWithDeps, startTransition } from './state'
import {
  serialize,
  withMiddleware,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  getTimestamp,
  mergeObjects
} from 'swr/_internal'
import type {
  SWRMutationConfiguration,
  SWRMutationResponse,
  SWRMutationHook,
  MutationFetcher
} from './types'

const mutation = (<Data, Error>() =>
  (
    key: Key,
    fetcher: MutationFetcher<Data>,
    config: SWRMutationConfiguration<Data, Error> = {}
  ) => {
    const { mutate } = useSWRConfig()
    const keyRef = useRef(key)
    const fetcherRef = useRef(fetcher)
    const configRef = useRef(config)
    // Ditch all mutation results that happened earlier than this timestamp.
    const ditchMutationsUntilRef = useRef(0)

    const [stateRef, stateDependencies, setState] = useStateWithDeps({
      data: UNDEFINED,
      error: UNDEFINED,
      isMutating: false
    })
    const currentState = stateRef.current

    const trigger = useCallback(
      async (arg: any, opts?: SWRMutationConfiguration<Data, Error>) => {
        const [serializedKey, resolvedKey] = serialize(keyRef.current)

        if (!fetcherRef.current) {
          throw new Error('Can’t trigger the mutation: missing fetcher.')
        }
        if (!serializedKey) {
          throw new Error('Can’t trigger the mutation: missing key.')
        }

        // Disable cache population by default.
        const options = mergeObjects(
          mergeObjects(
            { populateCache: false, throwOnError: true },
            configRef.current
          ),
          opts
        )

        // Trigger a mutation, and also track the timestamp. Any mutation that happened
        // earlier this timestamp should be ignored.
        const mutationStartedAt = getTimestamp()

        ditchMutationsUntilRef.current = mutationStartedAt

        setState({ isMutating: true })

        try {
          const data = await mutate<Data>(
            serializedKey,
            (fetcherRef.current as any)(resolvedKey, { arg }),
            // We must throw the error here so we can catch and update the states.
            mergeObjects(options, { throwOnError: true })
          )

          // If it's reset after the mutation, we don't broadcast any state change.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            startTransition(() =>
              setState({ data, isMutating: false, error: undefined })
            )
            options.onSuccess?.(data as Data, serializedKey, options)
          }
          return data
        } catch (error) {
          // If it's reset after the mutation, we don't broadcast any state change
          // or throw because it's discarded.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            startTransition(() =>
              setState({ error: error as Error, isMutating: false })
            )
            options.onError?.(error as Error, serializedKey, options)
            if (options.throwOnError) {
              throw error as Error
            }
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    const reset = useCallback(() => {
      ditchMutationsUntilRef.current = getTimestamp()
      setState({ data: UNDEFINED, error: UNDEFINED, isMutating: false })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useIsomorphicLayoutEffect(() => {
      keyRef.current = key
      fetcherRef.current = fetcher
      configRef.current = config
    })

    // We don't return `mutate` here as it can be pretty confusing (e.g. people
    // calling `mutate` but they actually mean `trigger`).
    // And also, `mutate` relies on the useSWR hook to exist too.
    return {
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
        stateDependencies.isMutating = true
        return currentState.isMutating
      }
    }
  }) as unknown as Middleware

/**
 * A hook to define and manually trigger remote mutations like POST, PUT, DELETE and PATCH use cases.
 *
 * @link https://swr.vercel.app/docs/mutation
 * @example
 * ```jsx
 * import useSWRMutation from 'swr/mutation'
 *
 * const {
 *   data,
 *   error,
 *   trigger,
 *   reset,
 *   isMutating
 * } = useSWRMutation(key, fetcher, options?)
 * ```
 */
const useSWRMutation = withMiddleware(
  useSWR,
  mutation
) as unknown as SWRMutationHook

export default useSWRMutation

export {
  SWRMutationConfiguration,
  SWRMutationResponse,
  SWRMutationHook,
  MutationFetcher
}
