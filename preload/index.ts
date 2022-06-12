import useSWR, { Middleware, unstable_serialize, Key, BareFetcher } from 'swr'
import { withMiddleware } from 'swr/_internal'

const preloadMap = new Map<string, Promise<any>>()

export const prefetch = (key: Key, fetcher: BareFetcher<any>) => {
  const promise = fetcher(key)
  const keyString = unstable_serialize(key)
  preloadMap.set(keyString, promise)
  return promise
}

export const preload: Middleware = useSWRNext => (key, fetcher_, config) => {
  const fetcher =
    fetcher_ === null
      ? null
      : async (...args: any[]) => {
          const keyString = unstable_serialize(key)
          const promise = preloadMap.get(keyString)
          if (promise) {
            await promise
            preloadMap.delete(keyString)
            return promise
          }
          return fetcher_(...args)
        }

  return useSWRNext(key, fetcher, config)
}

export default withMiddleware(useSWR, preload)
