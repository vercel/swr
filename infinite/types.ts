import { SWRConfiguration, SWRResponse, Arguments, BareFetcher } from 'swr'

type FetcherResponse<Data = unknown> = Data | Promise<Data>

export type InfiniteFetcher<
  KeyLoader extends InfiniteKeyLoader = InfiniteKeyLoader,
  Data = any
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

export type SWRInfiniteConfiguration<
  Data = any,
  Error = any,
  Args extends Arguments = Arguments
> = SWRConfiguration<Data[], Error, Args> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
  revalidateFirstPage?: boolean
}

export interface SWRInfiniteResponse<Data = any, Error = any>
  extends SWRResponse<Data[], Error> {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
}

export interface SWRInfiniteHook {
  <Data = any, Error = any, KeyLoader extends InfiniteKeyLoader = () => null>(
    getKey: KeyLoader
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, KeyLoader extends InfiniteKeyLoader = () => null>(
    getKey: KeyLoader,
    fetcher: InfiniteFetcher<KeyLoader, Data> | null
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, KeyLoader extends InfiniteKeyLoader = () => null>(
    getKey: KeyLoader,
    config: SWRInfiniteConfiguration<Data, Error> | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any, KeyLoader extends InfiniteKeyLoader = () => null>(
    getKey: KeyLoader,
    fetcher: InfiniteFetcher<KeyLoader, Data> | null,
    config: SWRInfiniteConfiguration<Data, Error> | undefined
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
    config: SWRInfiniteConfiguration<Data, Error, Arguments> | undefined
  ): SWRInfiniteResponse<Data, Error>
  <Data = any, Error = any>(
    getKey: InfiniteKeyLoader,
    fetcher: BareFetcher<Data> | null,
    config: SWRInfiniteConfiguration<Data, Error, Arguments> | undefined
  ): SWRInfiniteResponse<Data, Error>
}
