import { serialize } from './serialize'

import type { BareFetcher, CacheData, FetcherResponse, Key } from '../types'

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
): CacheData<Data> => {
  const [key, fnArg] = serialize(key_)

  return {
    [key]: fetcher(fnArg) as FetcherResponse<Data>
  }
}
