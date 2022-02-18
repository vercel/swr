import * as revalidateEvents from './constants/revalidate-events'

export type FetcherResponse<Data = unknown> = Data | Promise<Data>
export type BareFetcher<Data = unknown> = (
  ...args: any[]
) => FetcherResponse<Data>
export type Fetcher<
  Data = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => readonly [...infer Args] | null | undefined | false
  ? (...args: [...Args]) => FetcherResponse<Data>
  : SWRKey extends readonly [...infer Args]
  ? (...args: [...Args]) => FetcherResponse<Data>
  : SWRKey extends () => infer Arg | null | undefined | false
  ? (...args: [Arg]) => FetcherResponse<Data>
  : SWRKey extends null | undefined | false
  ? never
  : SWRKey extends infer Arg
  ? (...args: [Arg]) => FetcherResponse<Data>
  : never

// Configuration types that are only used internally, not exposed to the user.
export interface InternalConfiguration {
  cache: Cache
  mutate: ScopedMutator
}

export interface PublicConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher = BareFetcher
> {
  errorRetryInterval: number
  errorRetryCount?: number
  loadingTimeout: number
  focusThrottleInterval: number
  dedupingInterval: number
  refreshInterval?: number | ((latestData: Data | undefined) => number)
  refreshWhenHidden?: boolean
  refreshWhenOffline?: boolean
  revalidateOnFocus: boolean
  revalidateOnReconnect: boolean
  revalidateOnMount?: boolean
  revalidateIfStale: boolean
  shouldRetryOnError: boolean | ((err: Error) => boolean)
  suspense?: boolean
  fallbackData?: Data
  fetcher?: Fn
  use?: Middleware[]
  fallback: { [key: string]: any }

  isPaused: () => boolean
  onLoadingSlow: (
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  onError: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>,
    revalidate: Revalidator,
    revalidateOpts: Required<RevalidatorOptions>
  ) => void
  onDiscarded: (key: string) => void

  compare: (a: Data | undefined, b: Data | undefined) => boolean

  isOnline: () => boolean
  isVisible: () => boolean
}

export type FullConfiguration = InternalConfiguration & PublicConfiguration

export type ProviderConfiguration = {
  initFocus: (callback: () => void) => (() => void) | void
  initReconnect: (callback: () => void) => (() => void) | void
}

export interface SWRHook {
  <Data = any, Error = any, SWRKey extends Key = null>(
    key: SWRKey
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = null>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = null>(
    key: SWRKey,
    config: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>> | undefined
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = null>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null,
    config: SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>> | undefined
  ): SWRResponse<Data, Error>
  <Data = any, Error = any>(key: Key): SWRResponse<Data, Error>
  <Data = any, Error = any>(
    key: Key,
    fetcher: BareFetcher<Data> | null
  ): SWRResponse<Data, Error>
  <Data = any, Error = any>(
    key: Key,
    config: SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRResponse<Data, Error>
  <Data = any, Error = any>(
    key: Key,
    fetcher: BareFetcher<Data> | null,
    config: SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  ): SWRResponse<Data, Error>
}

// Middleware guarantee that a SWRHook receives a key, fetcher, and config as the argument
export type Middleware = (
  useSWRNext: SWRHook
) => <Data = any, Error = any>(
  key: Key,
  fetcher: BareFetcher<Data> | null,
  config: SWRConfiguration<Data, Error, BareFetcher<Data>>
) => SWRResponse<Data, Error>

type ArgumentsTuple = [any, ...unknown[]] | readonly [any, ...unknown[]]
export type Arguments =
  | string
  | ArgumentsTuple
  | Record<any, any>
  | null
  | undefined
  | false
export type Key = Arguments | (() => Arguments)

export type MutatorCallback<Data = any> = (
  currentData?: Data
) => Promise<undefined | Data> | undefined | Data

export type MutatorOptions<Data = any> = {
  revalidate?: boolean
  populateCache?: boolean | ((result: any, currentData: Data) => Data)
  optimisticData?: Data | ((currentData?: Data) => Data)
  rollbackOnError?: boolean
}

export type Broadcaster<Data = any, Error = any> = (
  cache: Cache<Data>,
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean,
  revalidate?: boolean,
  populateCache?: boolean
) => Promise<Data>

export type State<Data, Error> = {
  data?: Data
  error?: Error
  isValidating?: boolean
}

export type MutatorFn<Data = any> = (
  cache: Cache,
  key: Key,
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  opts?: boolean | MutatorOptions<Data>
) => Promise<Data | undefined>

export type MutatorWrapper<Fn> = Fn extends (
  ...args: [...infer Parameters]
) => infer Result
  ? Parameters[3] extends boolean
    ? Result
    : Parameters[3] extends Required<Pick<MutatorOptions, 'populateCache'>>
    ? Parameters[3]['populateCache'] extends false
      ? never
      : Result
    : Result
  : never

export type Mutator<Data = any> = MutatorWrapper<MutatorFn<Data>>

export interface ScopedMutator<Data = any> {
  /** This is used for bound mutator */
  (
    key: Key,
    data?: Data | Promise<Data> | MutatorCallback<Data>,
    opts?: boolean | MutatorOptions<Data>
  ): Promise<Data | undefined>
  /** This is used for global mutator */
  <T = any>(
    key: Key,
    data?: T | Promise<T> | MutatorCallback<T>,
    opts?: boolean | MutatorOptions<Data>
  ): Promise<T | undefined>
}

export type KeyedMutator<Data> = (
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  opts?: boolean | MutatorOptions<Data>
) => Promise<Data | undefined>

// Public types

export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends BareFetcher<any> = BareFetcher<any>
> = Partial<PublicConfiguration<Data, Error, Fn>>

export interface SWRResponse<Data = any, Error = any> {
  data?: Data
  error?: Error
  mutate: KeyedMutator<Data>
  isValidating: boolean
}

export type KeyLoader<Args extends Arguments = Arguments> =
  | ((index: number, previousPageData: any | null) => Args)
  | null

export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

export type Revalidator = (
  revalidateOpts?: RevalidatorOptions
) => Promise<boolean> | void

export type RevalidateEvent =
  | typeof revalidateEvents.FOCUS_EVENT
  | typeof revalidateEvents.RECONNECT_EVENT
  | typeof revalidateEvents.MUTATE_EVENT

type RevalidateCallbackReturnType = {
  [revalidateEvents.FOCUS_EVENT]: void
  [revalidateEvents.RECONNECT_EVENT]: void
  [revalidateEvents.MUTATE_EVENT]: Promise<boolean>
}
export type RevalidateCallback = <K extends RevalidateEvent>(
  type: K
) => RevalidateCallbackReturnType[K]

export type StateUpdateCallback<Data = any, Error = any> = (
  data?: Data,
  error?: Error,
  isValidating?: boolean
) => void

export interface Cache<Data = any> {
  get(key: Key): Data | null | undefined
  set(key: Key, value: Data): void
  delete(key: Key): void
}
