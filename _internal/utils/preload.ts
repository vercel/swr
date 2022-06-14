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
      : // fetcher might be a sync function, so this should not be an async function
        (...args: any[]) => {
          const keyString = serialize(key)[0]
          const promise = preloadMap.get(keyString)
          if (promise) {
            promise.then(result => {
              preloadMap.delete(keyString)
              return result
            })
            return promise
          }
          return fetcher_(...args)
        }

  return useSWRNext(key, fetcher, config)
}
