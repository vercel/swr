import { Middleware, Key, BareFetcher, FetcherResponse } from '../types'
import { serialize } from './serialize'

const REQUEST = new Map<string, FetcherResponse<any>>()

export const preload = <Data = any>(key_: Key, fetcher: BareFetcher<Data>) => {
  const req = fetcher(key_)
  const key = serialize(key_)[0]
  REQUEST.set(key, req)
  return req
}

export const middleware: Middleware =
  useSWRNext => (key_, fetcher_, config) => {
    // fetcher might be a sync function, so this should not be an async function
    const fetcher =
      fetcher_ &&
      ((...args: any[]) => {
        const key = serialize(key_)[0]
        const req = REQUEST.get(key)
        if (req) {
          REQUEST.delete(key)
          return req
        }
        return fetcher_(...args)
      })
    return useSWRNext(key_, fetcher, config)
  }
