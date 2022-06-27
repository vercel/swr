import type { Middleware, Key, BareFetcher, GlobalState } from '../types'
import { serialize } from './serialize'
import { cache } from './config'
import { SWRGlobalState } from './global-state'

export const preload = <Data = any>(key_: Key, fetcher: BareFetcher<Data>) => {
  const key = serialize(key_)[0]
  const [, , , PRELOAD] = SWRGlobalState.get(cache) as GlobalState

  // Prevent preload to be called multiple times before used.
  if (PRELOAD[key]) return PRELOAD[key]

  const req = fetcher(key_)
  PRELOAD[key] = req
  return req
}

export const middleware: Middleware =
  useSWRNext => (key_, fetcher_, config) => {
    // fetcher might be a sync function, so this should not be an async function
    const fetcher =
      fetcher_ &&
      ((...args: any[]) => {
        const key = serialize(key_)[0]
        const [, , , PRELOAD] = SWRGlobalState.get(cache) as GlobalState
        const req = PRELOAD[key]
        if (req) {
          delete PRELOAD[key]
          return req
        }
        return fetcher_(...args)
      })
    return useSWRNext(key_, fetcher, config)
  }
