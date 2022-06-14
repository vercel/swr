import { Middleware, Key, BareFetcher } from '../types'
import { serialize } from './serialize'

const preloadMap = new Map<string, Promise<any>>()

export const preload = (key: Key, fetcher: BareFetcher<any>) => {
  const promise = fetcher(key)
  const keyString = serialize(key)[0]
  preloadMap.set(keyString, promise)
  return promise
}

export const middleware: Middleware = useSWRNext => (key, fetcher_, config) => {
  const fetcher =
    fetcher_ == null
      ? null
      : async (...args: any[]) => {
          const keyString = serialize(key)[0]
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
