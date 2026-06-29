import type { Middleware } from '../index'
import useSWR from '../index'
import { withMiddleware } from '../_internal'

export const immutable: Middleware = useSWRNext => (key, fetcher, config) => {
  // Always override all revalidate options.
  return useSWRNext(key, fetcher, {
    ...config,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    refreshInterval: 0
  })
}

const useSWRImmutable = withMiddleware(useSWR, immutable)

export default useSWRImmutable
