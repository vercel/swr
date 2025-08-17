import type {
  SWRConfiguration,
  SWRResponse,
  Arguments,
  BareFetcher,
  State,
  StrictTupleKey,
  MutatorOptions,
  MutatorCallback
} from '../_internal'

type FetcherResponse<Data = unknown> = Data | Promise<Data>

export type SWRInfiniteFetcher<
  Data = any,
  KeyLoader extends SWRInfiniteKeyLoader = SWRInfiniteKeyLoader
> = KeyLoader extends (...args: any[]) => any
  ? ReturnType<KeyLoader> extends infer T | null | false | undefined
    ? (args: T) => FetcherResponse<Data>
    : never
  : never

export type SWRInfiniteKeyLoader<
  Data = any,
  Args extends Arguments = Arguments
> = (index: number, previousPageData: Data | null) => Args

export interface SWRInfiniteCompareFn<Data = any> {
  (a: Data | undefined, b: Data | undefined): boolean
  (a: Data[] | undefined, b: Data[] | undefined): boolean
}
export interface SWRInfiniteConfiguration<
  Data = any,
  Error = any,
  Fn extends SWRInfiniteFetcher<Data> = BareFetcher<Data>
> extends Omit<SWRConfiguration<Data[], Error>, 'compare'> {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
  revalidateFirstPage?: boolean
  parallel?: boolean
  fetcher?: Fn
  compare?: SWRInfiniteCompareFn<Data>
}

interface SWRInfiniteRevalidateFn<Data = any> {
  (data: Data, key: Arguments): boolean
}

export type SWRInfiniteKeyedMutator<Data> = {
  (
    data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
    opts?: boolean | SWRInfiniteMutatorOptions<Data, Data>
  ): Promise<Data | undefined>
  <MutationData = Data>(
    data:
      | MutationData
      | Promise<MutationData | undefined>
      | MutatorCallback<MutationData>,
    opts: Omit<
      SWRInfiniteMutatorOptions<Data, MutationData>,
      'populateCache'
    > & {
      populateCache: (
        result: MutationData,
        currentData: Data | undefined
      ) => Data
    }
  ): Promise<Data | MutationData | undefined>
}

export interface SWRInfiniteMutatorOptions<Data = any, MutationData = Data>
  extends Omit<MutatorOptions<Data, MutationData>, 'revalidate'> {
  revalidate?:
    | boolean
    | SWRInfiniteRevalidateFn<Data extends unknown[] ? Data[number] : never>
}

export interface SWRInfiniteResponse<Data = any, Error = any>
  extends Omit<SWRResponse<Data[], Error>, 'mutate'> {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
  mutate: SWRInfiniteKeyedMutator<Data[]>
}

export interface SWRInfiniteHook {
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => StrictTupleKey
  >(
    getKey: KeyLoader
  ): SWRInfiniteResponse<Data, Error>
  <
    Data = any,
    Error = any,
    KeyLoader extends SWRInfiniteKeyLoader = (
      index: number,
      previousPageData: Data | null
    ) => StrictTupleKey
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
    ) => StrictTupleKey
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
    ) => StrictTupleKey
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

export interface SWRInfiniteCacheValue<Data = any, Error = any>
  extends State<Data, Error> {
  // We use cache to pass extra info (context) to fetcher so it can be globally
  // shared. The key of the context data is based on the first-page key.
  _i?: boolean
  // Page size is also cached to share the page data between hooks with the
  // same key.
  _l?: number
  _k?: Arguments
  _r?: boolean | SWRInfiniteRevalidateFn
}
