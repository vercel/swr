import type {
  Fetcher,
  Key,
  Middleware,
  SWRConfiguration,
  SWRHook
} from '../index'
import useSWR from '../index'
import { normalize } from '../_internal'

export const immutable: Middleware = useSWRNext => (key, fetcher, config) => {
  // Always override all revalidate options.
  config.revalidateOnFocus = false
  config.revalidateIfStale = false
  config.revalidateOnReconnect = false
  return useSWRNext(key, fetcher, config)
}

const useSWRImmutable: SWRHook = <Data = any, Error = any>(
  ...args:
    | [Key]
    | [Key, Fetcher<Data> | null]
    | [Key, SWRConfiguration | undefined]
    | [Key, Fetcher<Data> | null, SWRConfiguration | undefined]
) => {
  const [key, fn, config] = normalize(args)
  const hookConfig = {
    refreshInterval: 0,
    ...config,
    use: (config.use || []).concat(immutable)
  }
  return useSWR<Data, Error>(key, fn, hookConfig)
}

export default useSWRImmutable
