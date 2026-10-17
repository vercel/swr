import { useCallback, useRef } from 'react'
import useSWR, { useSWRConfig } from '../index'
import type { Middleware, Key } from '../_internal'
import { useStateWithDeps, startTransition } from './state'
import {
  serialize,
  withMiddleware,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  getTimestamp,
  mergeObjects
} from '../_internal'
import type {
  SWRMutationConfiguration,
  SWRMutationResponse,
  SWRMutationHook,
  MutationFetcher,
  TriggerWithArgs,
  TriggerWithoutArgs,
  TriggerWithOptionsArgs
} from './types'
import { useTransition } from './use-transition'

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

    const [stateRef, stateDependencies, setState] = useStateWithDeps<{
      data: Data | undefined
      error: Error | undefined
    }>({
      data: UNDEFINED,
      error: UNDEFINED
    })

    // https://github.com/vercel/swr/issues/4247
    //
    // In short, when `trigger` is called within a transition (e.g. React's <form action /> action prop),
    // any state update inside the transition (a.k.a. the `trigger` function) will be deferred/delayed until
    // the transition finishes, which means async function is resolved/rejected.
    //
    // However, we don't want `isMutating` update (false -> true -> false) to be deferred/delayed, otherwise
    // the UI won't be able to reflect the loading state.
    //
    // One way to do this is to use `useTransition`. In React 19, `useTransition`'s `isPending` can be used to
    // track async transition resolved/rejected state. And `isPending` would be an urgent update that won't be
    // deferred/delayed.
    //
    // React 18's `useTransition` doesn't support async function tracking. In React 16 and 17, there is no
    // `useTransition` at all. A polyfill will be used.
    const [isMutating, startMutation] = useTransition()

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

        const mutatePromise = mutate<Data>(
          serializedKey,
          (fetcherRef.current as any)(resolvedKey, { arg }),
          // We must throw the error here so we can catch and update the states.
          mergeObjects(options, { throwOnError: true })
        )

        // startTransition returns void, so we can only use it to track the async function state
        startMutation(async () => {
          try {
            await mutatePromise
          } catch {
            // ignore error in transition state tracking
          }
        })

        try {
          // actually get result from the mutation promise and handle potential error
          const data = await mutatePromise

          // If it's reset after the mutation, we don't broadcast any state change.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            startTransition(() => setState({ data, error: undefined }))
            options.onSuccess?.(data as Data, serializedKey, options)
          }
          return data
        } catch (error) {
          // If it's reset after the mutation, we don't broadcast any state change
          // or throw because it's discarded.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            startTransition(() => setState({ error: error as Error }))
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
      setState({ data: UNDEFINED, error: UNDEFINED })
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
      isMutating
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
  MutationFetcher,
  TriggerWithArgs,
  TriggerWithoutArgs,
  TriggerWithOptionsArgs
}
