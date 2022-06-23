import {
  Arguments,
  Fetcher,
  Key,
  SWRConfiguration,
  SWRResponse
} from 'swr/_internal'

export type SWRListConfiguration<Data = any, Error = any> = SWRConfiguration<
  Data[],
  Error
>

export type SWRListResponse<Data = any, Error = any> = SWRResponse<
  Data,
  Error
>[]

export interface SWRListHook {
  <Data = any, Error = any, SWRListArguments extends Arguments = Arguments>(
    keys: Key[]
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any, SWRListArguments extends Arguments = Arguments>(
    keys: Key[],
    fetcher: Fetcher<Data> | null
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any, SWRListArguments extends Arguments = Arguments>(
    keys: Key[],
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
  <Data = any, Error = any>(
    keys: Key[],
    fetcher: Fetcher<Data> | null,
    config: SWRListConfiguration<Data, Error> | undefined
  ): SWRListResponse<Data, Error>
}
