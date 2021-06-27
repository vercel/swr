import { useSWRHandler } from './use-swr'
import { Middleware, SWRHook } from './types'
import withArgs from './resolve-args'

const immutableMiddleware: Middleware = useSWRNext => (
  key,
  fetcher,
  config
) => {
  // Always override all revalidate options.
  config.revalidateOnFocus = false
  config.revalidateWhenStale = false
  config.revalidateOnReconnect = false
  return useSWRNext(key, fetcher, config)
}

export default withArgs<SWRHook>(useSWRHandler, [immutableMiddleware])
