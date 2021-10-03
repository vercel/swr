import * as revalidateEvents from './constants/revalidate-events'

type Async<Data> = Data | Promise<Data>
export type FetcherResponse<Data = unknown> = Async<Data>

export type Fetcher<Data = unknown, SWRKey extends Key = Key> =
  /**
   * () => [{ foo: string }, { bar: number }] | null
   * () => ( [{ foo: string }, { bar: number } ] as const | null )
   */
  SWRKey extends (() => readonly [...infer Args] | null)
    ? ((...args: [...Args]) => FetcherResponse<Data>)
      /**
       * [{ foo: string }, { bar: number } ] | null
       * [{ foo: string }, { bar: number } ] as const | null
       */
    : SWRKey extends (readonly [...infer Args])
    ? ((...args: [...Args]) => FetcherResponse<Data>)
      /**
       * () => string | null
       * () => Record<any, any> | null
       */
    : SWRKey extends (() => infer Arg | null)
    ? (...args: [Arg]) => FetcherResponse<Data>
      /**
       *  string | null | Record<any,any>
       */
    : SWRKey extends null
    ? never
    : SWRKey extends (infer Arg)
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
  SWRKey extends Key = Key
> {
  errorRetryInterval: number
  errorRetryCount?: number
  loadingTimeout: number
  focusThrottleInterval: number
  dedupingInterval: number
  refreshInterval?: number
  refreshWhenHidden?: boolean
  refreshWhenOffline?: boolean
  revalidateOnFocus: boolean
  revalidateOnReconnect: boolean
  revalidateOnMount?: boolean
  revalidateIfStale: boolean
  shouldRetryOnError: boolean
  suspense?: boolean
  fallbackData?: Data
  fetcher?: Fetcher<Data, SWRKey>
  use?: Middleware[]
  fallback: { [key: string]: any }

  isPaused: () => boolean
  onLoadingSlow: (
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, SWRKey>>
  ) => void
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, SWRKey>>
  ) => void
  onError: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, SWRKey>>
  ) => void
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, SWRKey>>,
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
  <Data = any, Error = any, SWRKey extends Key = Key>(key: SWRKey): SWRResponse<
    Data,
    Error
  >
  <Data = any, Error = any, SWRKey extends Key = Key>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = Key>(
    key: SWRKey,
    config: SWRConfiguration<Data, Error, SWRKey> | undefined
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = Key>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey>,
    config: SWRConfiguration<Data, Error, SWRKey> | undefined
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = Key>(
    ...args:
      | [SWRKey]
      | [SWRKey, Fetcher<Data, SWRKey> | null]
      | [SWRKey, SWRConfiguration<Data, Error, SWRKey> | undefined]
      | [
          SWRKey,
          Fetcher<Data, Key> | null,
          SWRConfiguration<Data, Error, SWRKey> | undefined
        ]
  ): SWRResponse<Data, Error>
}

// Middlewares guarantee that a SWRHook receives a key, fetcher, and config as the argument
export type Middleware = (
  useSWRNext: SWRHook
) => <Data = any, Error = any, Args extends Key = Key>(
  key: Args,
  fetcher: Fetcher<Data, Args> | null,
  config: SWRConfiguration<Data, Error>
) => SWRResponse<Data, Error>

type ArgumentsTuple = [any, ...unknown[]] | readonly [any, ...unknown[]]
export type Arguments = string | null | ArgumentsTuple | Record<any, any>
export type Key = Arguments | (() => Arguments)

export type MutatorCallback<Data = any> = (
  currentValue?: Readonly<Data>
) => Async<undefined | Data | Readonly<Data>>

export type Broadcaster<Data = any, Error = any> = (
  cache: Cache<Data>,
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean,
  shouldRevalidate?: boolean
) => Promise<Data>

export type State<Data, Error> = {
  data?: Data
  error?: Error
  isValidating?: boolean
}

type MutatorData<Data> =
  | Async<Data>
  | Async<Readonly<Data>>
  | MutatorCallback<Data>

export type Mutator<Data = any> = (
  cache: Cache,
  key: Key,
  data?: MutatorData<Data>,
  shouldRevalidate?: boolean
) => Promise<Readonly<Data> | undefined>

export interface ScopedMutator<Data = any> {
  /** This is used for bound mutator */
  (key: Key, data?: MutatorData<Data>, shouldRevalidate?: boolean): Promise<
    Readonly<Data> | undefined
  >
  /** This is used for global mutator */
  <T = any>(
    key: Key,
    data?: MutatorData<T>,
    shouldRevalidate?: boolean
  ): Promise<Readonly<T> | undefined>
}

export type KeyedMutator<Data> = (
  data?: MutatorData<Data>,
  shouldRevalidate?: boolean
) => Promise<Readonly<Data> | undefined>

// Public types

export type SWRConfiguration<
  Data = any,
  Error = any,
  SWRKey extends Key = Key
> = Partial<PublicConfiguration<Data, Error, SWRKey>>

export interface SWRResponse<Data, Error> {
  data?: Readonly<Data>
  error?: Readonly<Error>
  isValidating: boolean
  mutate: KeyedMutator<Data>
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
