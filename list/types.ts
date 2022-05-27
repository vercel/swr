import {
  SWRConfiguration,
  Arguments,
  BareFetcher,
  KeyedMutator
} from 'swr/_internal'

type FetcherResponse<Data = unknown> = Data | Promise<Data>
export type SWRListKey<T extends Arguments = Arguments> = T[]

export type SWRListFetcher<Data = any, Key extends Arguments = Arguments> = (
  args: Key
) => FetcherResponse<Data>

export type SWRListConfiguration<Data = any, Error = any> = SWRConfiguration<
  Data[],
  Error
>

export interface SWRListResponse<
  Data = any,
  Error = any,
  Key extends Arguments = Arguments
> {
  result: Array<{
    data: Data | undefined
    error: Error | undefined
    mutate: KeyedMutator<Data>
    isValidating: boolean
    isLoading: boolean
    key: string
    originKey: Key
  }>
  mutate: KeyedMutator<Data[]>
  data?: {
    data?: Data
    error?: Error
    key: string
    originKey: Key
  }
  isValidating: boolean
  isLoading: boolean
}

export interface SWRListHook {
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: SWRListKey<Key>
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: SWRListKey<Key>,
    fetcher: SWRListConfiguration<Data, Error> | null
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: SWRListKey<Key>,
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: SWRListKey<Key>,
    fetcher: SWRListFetcher<Data, Key> | null,
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any>(key: SWRListKey): SWRListResponse<Data, Error>
  <Data = any, Error = any>(
    key: SWRListKey,
    fetcher: BareFetcher<Data> | null
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any>(
    key: SWRListKey,
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any>(
    key: SWRListKey,
    fetcher: BareFetcher<Data> | null,
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
}
