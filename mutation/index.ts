import { useCallback, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import {
  serialize,
  useStateWithDeps,
  withMiddleware,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  getTimestamp,
  Middleware,
  Key
} from 'swr/_internal'
import {
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

        if (!fetcher) {
          throw new Error('Can’t trigger the mutation: missing fetcher.')
        }
        if (!serializedKey) {
          throw new Error('Can’t trigger the mutation: key isn’t ready.')
        }

        // Disable cache population by default.
        const options = Object.assign({ populateCache: false }, config, opts)

        // Trigger a mutation, also track the timestamp. Any mutation that happened
        // earlier this timestamp should be ignored.
        const mutationStartedAt = getTimestamp()

        ditchMutationsUntilRef.current = mutationStartedAt

        setState({ isMutating: true })

        try {
          const data = await mutate<Data>(
            serializedKey,
            (fetcher as any)(resolvedKey, { arg }),
            options
          )

          // If it's reset after the mutation, we don't broadcast any state change.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            setState({ data, isMutating: false })
            options.onSuccess?.(data as Data, serializedKey, options)
          }
          return data
        } catch (error) {
          // If it's reset after the mutation, we don't broadcast any state change.
          if (ditchMutationsUntilRef.current <= mutationStartedAt) {
            setState({ error: error as Error, isMutating: false })
            options.onError?.(error as Error, serializedKey, options)
            throw error as Error
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

export default withMiddleware(useSWR, mutation) as unknown as SWRMutationHook

export { SWRMutationConfiguration, SWRMutationResponse, SWRMutationHook }
