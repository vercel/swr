import { serialize } from './serialize'

import type {
  BareFetcher,
  FetcherResponse,
  Key,
  UnstablePreloadEntry
} from '../types'

type PreloadFetcher<
  Data = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : SWRKey extends infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : never

export const unstable_preload = <
  Data = any,
  SWRKey extends Key = Key,
  Fetcher extends BareFetcher = PreloadFetcher<Data, SWRKey>
>(
  key_: SWRKey,
  fetcher: Fetcher
): UnstablePreloadEntry<Data> => {
  const [key, fnArg] = serialize(key_)

  return {
    key,
    data: fetcher(fnArg) as FetcherResponse<Data>
  }
}
