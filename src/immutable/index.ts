import type { Middleware } from '../core'
import useSWR from '../core'
import { withMiddleware } from '../_internal'

export const immutable: Middleware = useSWRNext => (key, fetcher, config) => {
  // Always override all revalidate options.
  config.revalidateOnFocus = false
  config.revalidateIfStale = false
  config.revalidateOnReconnect = false
  return useSWRNext(key, fetcher, config)
}

const useSWRImmutable = withMiddleware(useSWR, immutable)

export default useSWRImmutable
