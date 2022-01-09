import { SWRConfiguration, SWRResponse, Arguments, BareFetcher } from 'swr'

type FetcherResponse<Data = unknown> = Data | Promise<Data>

export type SWRInfiniteFetcher<
  Data = any,
  KeyLoader extends SWRInfiniteKeyLoader = SWRInfiniteKeyLoader
> = KeyLoader extends (...args: any[]) => any
  ? ReturnType<KeyLoader> extends
      | readonly [...infer K]
      | null
      | false
      | undefined
    ? (...args: [...K]) => FetcherResponse<Data>
    : ReturnType<KeyLoader> extends infer T | null | false | undefined
    ? (...args: [T]) => FetcherResponse<Data>
    : never
  : never

export type SWRInfiniteKeyLoader = (
  index: number,
  previousPageData: any | null
) => Arguments

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
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    fetcher: SWRInfiniteFetcher<Data, KeyLoader> | null
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    config:
      | SWRInfiniteConfiguration<
          Data,
          Error,
          SWRInfiniteFetcher<Data, KeyLoader>
        >
      | undefined
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => null
  >(
    getKey: KeyLoader,
    fetcher: SWRInfiniteFetcher<Data, KeyLoader> | null,
    config:
      | SWRInfiniteConfiguration<
          Data,
          Error,
          SWRInfiniteFetcher<Data, KeyLoader>
        >
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
