import type {
  SWRConfiguration,
  SWRResponse,
  Arguments,
  BareFetcher,
  State
} from 'swr/_internal'

type FetcherResponse<Data = unknown> = Data | Promise<Data>

export type SWRInfiniteFetcher<
  Data = any,
  Key extends Arguments = Arguments
> = Key extends readonly [...infer Args]
  ? (args: [...Args]) => FetcherResponse<Data>
  : Key extends [...infer Args]
  ? (args: [...Args]) => FetcherResponse<Data>
  : Key extends null | undefined | false
  ? never
  : Key extends infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : never

export type SWRInfiniteKeyLoader<
  Data = any,
  Key extends Arguments = Arguments
> = (index: number, previousPageData: Data | null) => Key

export interface SWRInfiniteConfiguration<
  Data = any,
  Error = any,
  Fn extends SWRInfiniteFetcher<Data> = BareFetcher<Data>
> extends SWRConfiguration<Data[], Error> {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
  revalidateFirstPage?: boolean
  fetcher?: Fn
}

export interface SWRInfiniteResponse<Data = any, Error = any>
  extends SWRResponse<Data[], Error> {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
}

export interface SWRInfiniteHook {
  <Data = any, Error = any, Key extends Arguments = null>(
    getKey: SWRInfiniteKeyLoader<Data, Key>
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = null>(
    getKey: SWRInfiniteKeyLoader<Data, Key>,
    fetcher: SWRInfiniteFetcher<Data, Key> | null
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = null>(
    getKey: SWRInfiniteKeyLoader<Data, Key>,
    config:
      | SWRInfiniteConfiguration<Data, Error, SWRInfiniteFetcher<Data, Key>>
      | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = null>(
    getKey: SWRInfiniteKeyLoader<Data, Key>,
    fetcher: SWRInfiniteFetcher<Data, Key> | null,
    config:
      | SWRInfiniteConfiguration<Data, Error, SWRInfiniteFetcher<Data, Key>>
      | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(getKey: SWRInfiniteKeyLoader): SWRInfiniteResponse<
    Data,
    Error
  >
  <Data = any, Error = any>(
    getKey: SWRInfiniteKeyLoader,
    fetcher: BareFetcher<Data> | null
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(
    getKey: SWRInfiniteKeyLoader,
    config: SWRInfiniteConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(
    getKey: SWRInfiniteKeyLoader,
    fetcher: BareFetcher<Data> | null,
    config: SWRInfiniteConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRInfiniteResponse<Data, Error>
}

export interface SWRInfiniteCacheValue<Data = any, Error = any>
  extends State<Data, Error> {
  // We use cache to pass extra info (context) to fetcher so it can be globally
  // shared. The key of the context data is based on the first-page key.
  _i?: [boolean] | [boolean, Data[] | undefined]
  // Page size is also cached to share the page data between hooks with the
  // same key.
  _l?: number
  _k?: Arguments
}
