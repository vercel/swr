import {
  SWRConfiguration,
  Arguments,
  BareFetcher,
  KeyedMutator,
  Fetcher,
  SWRResponse
} from 'swr/_internal'

export type Keys<T extends Arguments = Arguments> = T[]

export interface SWRArray<
  Data = any,
  Error = any,
  Key extends Arguments = Arguments
> {
  mutate: KeyedMutator<Data[]>
  data?: Array<{
    data?: Data
    error?: Error
    key: string
    originKey: Key
  }>
  isValidating: boolean
  isLoading: boolean
}

export interface SWRAggregatorConfiguration<
  Data = any,
  Error = any,
  OriginKey extends Arguments = Arguments
> extends SWRConfiguration<Data, Error> {
  children: (
    value: SWRResponse<Data, Error>,
    index: number,
    array: SWRArray<Data, Error, OriginKey>
  ) => React.ReactElement<any, any> | null
}

interface AggregatorResult<
  Data = any,
  Error = any,
  Key extends Arguments = Arguments
> extends SWRArray<Data, Error, Key> {
  items: Array<JSX.Element | null>
}

export interface SWRAggregator {
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: Keys<Key>
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: Keys<Key>,
    fetcher: Fetcher<Data, Key> | null
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: Keys<Key>,
    config: SWRAggregatorConfiguration<Data, Error, Key> | undefined
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any, Key extends Arguments = Arguments>(
    key: Keys<Key>,
    fetcher: Fetcher<Data, Key> | null,
    config: SWRAggregatorConfiguration<Data, Error, Key> | undefined
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any>(key: Keys): AggregatorResult<Data, Error>
  <Data = any, Error = any>(
    key: Keys,
    fetcher: BareFetcher<Data> | null
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any>(
    key: Keys,
    config: SWRAggregatorConfiguration<Data, Error> | undefined
  ): AggregatorResult<Data, Error>
  <Data = any, Error = any>(
    key: Keys,
    fetcher: BareFetcher<Data> | null,
    config: SWRAggregatorConfiguration<Data, Error> | undefined
  ): AggregatorResult<Data, Error>
}
