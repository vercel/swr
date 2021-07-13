// @ts-ignore
import useSWR from 'swr'
import { useCallback } from 'react'

import { withMiddleware } from '../src/utils/with-middleware'
import { serialize } from '../src/utils/serialize'

import {
  Middleware,
  SWRHook,
  Key,
  Fetcher,
  SWRConfiguration,
  SWRResponse
} from '../src/types'

export const passive = ((<Data, Error>(useSWRNext: SWRHook) => (
  key: Key,
  fetcher: Fetcher<Data>,
  config: SWRConfiguration<Data, Error>
): SWRPassiveResponse<Data, Error> => {
  // Disable all revalidate options.
  config.revalidateOnFocus = false
  config.revalidateWhenStale = false
  config.revalidateOnReconnect = false

  // Disable options that are imcompatible with passive mode.
  config.suspense = false
  config.shouldRetryOnError = false
  config.refreshInterval = 0
  config.loadingTimeout = 0

  // Disable fetcher.
  const swr = useSWRNext(key, null, config) as SWRPassiveResponse

  // Serialize the key and get args.
  const [keyStr, args] = serialize(key)

  // Method to trigger the request manually.
  const trigger = useCallback(
    (...extraArgs) => {
      // Should we throw here as it's not ready to mutate?
      if (!keyStr || !fetcher) return

      // Mutate the SWR data and return the result.
      return swr.mutate(fetcher(...args, ...extraArgs), false)

      // `keyStr` is the serialized version of `args`, no need to put `args` here.
      // `fetcher` isn't considered as a dependency as well for now.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [keyStr]
  )

  swr.trigger = trigger
  return swr
}) as unknown) as Middleware

type SWRPassiveResponse<Data = any, Error = any> = SWRResponse<Data, Error> & {
  trigger: (...extraArguments: any[]) => ReturnType<Fetcher<Data>> | undefined
}

type SWRPassiveHook = <Data = any, Error = any>(
  ...args:
    | readonly [Key]
    | readonly [Key, Fetcher<Data> | null]
    | readonly [Key, SWRConfiguration<Data, Error> | undefined]
    | readonly [
        Key,
        Fetcher<Data> | null,
        SWRConfiguration<Data, Error> | undefined
      ]
) => SWRPassiveResponse<Data, Error>

export default withMiddleware(useSWR, passive) as SWRPassiveHook
