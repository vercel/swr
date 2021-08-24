import { normalize } from './normalize-args'

import { Key, Fetcher, Middleware, SWRConfiguration, SWRHook } from '../types'

// Create a custom hook with a middleware
export function withMiddleware(
  useSWR: SWRHook,
  middleware: Middleware
): SWRHook {
  return <Data = any, Error = any>(
    ...args:
      | readonly [Key]
      | readonly [Key, Fetcher<Data> | null]
      | readonly [Key, SWRConfiguration | undefined]
      | readonly [Key, Fetcher<Data> | null, SWRConfiguration | undefined]
  ) => {
    const [key, fn, config] = normalize(args)
    config.use = (config.use || []).concat(middleware)
    return useSWR<Data, Error>(key, fn, config)
  }
}
