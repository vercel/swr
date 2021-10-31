import { normalize } from './normalize-args'

import { Key, Fetcher, Middleware, SWRConfiguration, SWRHook } from '../types'

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
    const middlewares = (config.use || []).concat(middleware)
    return useSWR<Data, Error>(key, fn, { ...config, use: middlewares })
  }
}
