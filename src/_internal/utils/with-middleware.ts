import { normalize } from './normalize-args'

import type {
  Key,
  Fetcher,
  Middleware,
  SWRConfiguration,
  SWRHook
} from '../types'

// Create a custom hook with a middleware
export const withMiddleware = (
  useSWR: SWRHook,
  middleware: Middleware
): SWRHook => {
  return <Data = any, Error = any>(
    ...args:
      | [Key]
      | [Key, Fetcher<Data> | null]
      | [Key, SWRConfiguration | undefined]
      | [Key, Fetcher<Data> | null, SWRConfiguration | undefined]
  ) => {
    const [key, fn, config] = normalize(args)
    const uses = (config.use || []).concat(middleware)
    // Keep `undefined` distinct from an explicit `null` when forwarding the
    // normalized arguments. The public overload doesn't expose this internal
    // form, so narrow it back to the declared fetcher type here.
    return useSWR<Data, Error>(key, fn as Fetcher<Data> | null, {
      ...config,
      use: uses
    })
  }
}
