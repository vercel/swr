import { Middleware, Key, BareFetcher } from '../types'
import { serialize } from './serialize'

const REQUEST = new Map<string, Promise<any>>()

export const preload = (key_: Key, fetcher: BareFetcher<any>) => {
  const req = fetcher(key_)
  const key = serialize(key_)[0]
  REQUEST.set(key, req)
  return req
}

export const middleware: Middleware =
  useSWRNext => (key_, fetcher_, config) => {
    const fetcher =
      fetcher_ == null
        ? null
        : // fetcher might be a sync function, so this should not be an async function
          (...args: any[]) => {
            const key = serialize(key_)[0]
            const req = REQUEST.get(key)
            if (req) {
              REQUEST.delete(key)
              return req
            }
            return fetcher_(...args)
          }

    return useSWRNext(key_, fetcher, config)
  }
