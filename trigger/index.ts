// @ts-ignore
import useSWR, {
  Middleware,
  SWRHook,
  Key,
  Fetcher,
  SWRConfiguration,
  SWRResponse
} from 'swr'
import { useCallback, useRef } from 'react'

import { withMiddleware } from '../src/utils/with-middleware'

export const trigger = ((<Data, Error>(useSWRNext: SWRHook) => (
  key: Key,
  fetcher: Fetcher<Data>,
  config: SWRConfiguration<Data, Error>
): SWRTriggerResponse<Data, Error> => {
  // The hook is under trigger mode, and shouldn't share revalidators between
  // other hooks.
  config.trigger = true

  // Disable all automatic revalidations.
  config.revalidateOnMount = false
  config.revalidateOnFocus = false
  config.revalidateWhenStale = false
  config.revalidateOnReconnect = false

  // Disable options that are imcompatible with trigger mode.
  config.suspense = false
  config.shouldRetryOnError = false
  config.refreshInterval = 0
  config.loadingTimeout = 0

  // Use a ref to keep extra args.
  const extraArgsRef = useRef<any[]>([])

  // Extract callbacks.
  const swr = useSWRNext(
    key,
    (...args) => fetcher(...args, ...extraArgsRef.current),
    config
  ) as SWRTriggerResponse

  // Method to trigger the request manually.
  swr.trigger = useCallback(
    (...extraArgs) => {
      // Assign extra arguments to the ref, so the fetcher can access them later.
      extraArgsRef.current = extraArgs

      // Mutate the SWR data and return the result.
      return swr.mutate()
    },
    [swr.mutate]
  )

  return swr
}) as unknown) as Middleware

type SWRTriggerResponse<Data = any, Error = any> = SWRResponse<Data, Error> & {
  trigger: (...extraArguments: any[]) => ReturnType<Fetcher<Data>> | undefined
}

type SWRTriggerHook = <Data = any, Error = any>(
  ...args:
    | readonly [Key]
    | readonly [Key, Fetcher<Data> | null]
    | readonly [Key, SWRConfiguration<Data, Error> | undefined]
    | readonly [
        Key,
        Fetcher<Data> | null,
        SWRConfiguration<Data, Error> | undefined
      ]
) => SWRTriggerResponse<Data, Error>

export default withMiddleware(useSWR, trigger) as SWRTriggerHook
