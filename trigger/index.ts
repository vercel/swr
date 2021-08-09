// @ts-ignore
import useSWR, {
  Middleware,
  SWRHook,
  Key,
  Fetcher,
  SWRConfiguration,
  SWRResponse
} from 'swr'
import { useCallback } from 'react'

import { withMiddleware } from '../src/utils/with-middleware'
import { serialize } from '../src/utils/serialize'

export const trigger = ((<Data, Error>(useSWRNext: SWRHook) => (
  key: Key,
  fetcher: Fetcher<Data>,
  config: SWRConfiguration<Data, Error>
): SWRTriggerResponse<Data, Error> => {
  // Disable all revalidations.
  config.revalidateOnFocus = false
  config.revalidateWhenStale = false
  config.revalidateOnReconnect = false

  // Disable options that are imcompatible with trigger mode.
  config.suspense = false
  config.shouldRetryOnError = false
  config.refreshInterval = 0
  config.loadingTimeout = 0

  // Disable fetcher.
  const swr = useSWRNext(key, null, config) as SWRTriggerResponse

  // Serialize the key and get args.
  const [keyStr, args] = serialize(key)

  // Method to trigger the request manually.
  swr.trigger = useCallback(
    (...extraArgs) => {
      // If it's not ready to fetch, we throw an error.
      if (!keyStr) throw new Error('Empty SWR key.')
      if (!fetcher) throw new Error('Missing SWR fetcher.')

      // Mutate the SWR data and return the result.
      return swr.mutate(fetcher(...args, ...extraArgs), false)

      // `keyStr` is the serialized version of `args`, no need to put `args` here.
      // `fetcher` isn't considered as a dependency as well for now.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [keyStr]
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
