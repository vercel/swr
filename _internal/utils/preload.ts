import type {
  Middleware,
  Key,
  BareFetcher,
  GlobalState,
  FetcherResponse,
  ReactUsePromise
} from '../types'
import { serialize } from './serialize'
import { cache } from './config'
import { SWRGlobalState } from './global-state'
import { isPromiseLike, isUndefined } from './helper'
// Basically same as Fetcher but without Conditional Fetching
type PreloadFetcher<
  Data = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : SWRKey extends infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : never

export const preload = <
  Data = any,
  SWRKey extends Key = Key,
  Fetcher extends BareFetcher = PreloadFetcher<Data, SWRKey>
>(
  key_: SWRKey,
  fetcher: Fetcher
): ReturnType<Fetcher> => {
  const [key, fnArg] = serialize(key_)
  const [, , , PRELOAD] = SWRGlobalState.get(cache) as GlobalState

  // Prevent preload to be called multiple times before used.
  if (PRELOAD[key]) return PRELOAD[key]

  const req = fetcher(fnArg) as FetcherResponse<Data>
  PRELOAD[key] = req
  if (!isUndefined(req) && isPromiseLike(req)) {
    return req.then(data => {
      const promise = Promise.resolve(data) as ReactUsePromise<Data>
      promise.value = data
      promise.status = 'fulfilled'
      PRELOAD[key] = promise
      return data
    }) as ReturnType<Fetcher>
  }
  return req as ReturnType<Fetcher>
}

export const middleware: Middleware =
  useSWRNext => (key_, fetcher_, config) => {
    // fetcher might be a sync function, so this should not be an async function
    const fetcher =
      fetcher_ &&
      ((...args: any[]) => {
        const [key] = serialize(key_)
        const [, , , PRELOAD] = SWRGlobalState.get(cache) as GlobalState
        const req = PRELOAD[key]
        if (isUndefined(req)) return fetcher_(...args)
        if (
          !isPromiseLike(req) ||
          (req as ReactUsePromise<any>).status === 'fulfilled'
        ) {
          delete PRELOAD[key]
          return req
        }
        return (
          req.then(data => {
            delete PRELOAD[key]
            return data
          }) as Promise<any>
        ).catch(err => {
          delete PRELOAD[key]
          throw err
        })
      })
    return useSWRNext(key_, fetcher, config)
  }
