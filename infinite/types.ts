import { SWRConfiguration, SWRResponse, Arguments, BareFetcher } from 'swr'

type FetcherResponse<Data = unknown> = Data | Promise<Data>

export type InfiniteFetcher<
  Data = any,
  KeyLoader extends InfiniteKeyLoader = InfiniteKeyLoader
> = KeyLoader extends (...args: any[]) => any
  ? ReturnType<KeyLoader> extends (
      | readonly [...infer K]
      | null
      | false
      | undefined)
    ? ((...args: [...K]) => FetcherResponse<Data>)
    : ReturnType<KeyLoader> extends (infer T | null | false | undefined)
    ? (...args: [T]) => FetcherResponse<Data>
    : never
  : never

export type InfiniteKeyLoader = (
  index: number,
  previousPageData: any | null
) => Arguments

export interface SWRInfiniteConfiguration<
  Data = any,
  Error = any,
  Fn extends InfiniteFetcher<Data> = BareFetcher<Data>
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
  <
    Data = any,
    Error = any,
    KeyLoader extends InfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends InfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    fetcher: InfiniteFetcher<Data, KeyLoader> | null
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends InfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    config:
      | SWRInfiniteConfiguration<Data, Error, InfiniteFetcher<Data, KeyLoader>>
      | undefined
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends InfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    fetcher: InfiniteFetcher<Data, KeyLoader> | null,
    config:
      | SWRInfiniteConfiguration<Data, Error, InfiniteFetcher<Data, KeyLoader>>
      | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(getKey: InfiniteKeyLoader): SWRInfiniteResponse<
    Data,
    Error
  >
  <Data = any, Error = any>(
    getKey: InfiniteKeyLoader,
    fetcher: BareFetcher<Data> | null
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(
    getKey: InfiniteKeyLoader,
    config: SWRInfiniteConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(
    getKey: InfiniteKeyLoader,
    fetcher: BareFetcher<Data> | null,
    config: SWRInfiniteConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRInfiniteResponse<Data, Error>
}
