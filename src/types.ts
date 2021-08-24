export type Fetcher<Data> = (...args: any) => Data | Promise<Data>

// Configuration types that are only used internally, not exposed to the user.
export interface InternalConfiguration {
  cache: Cache
  mutate: ScopedMutator
}

export interface PublicConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
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
  revalidateWhenStale: boolean
  shouldRetryOnError: boolean
  suspense?: boolean
  fallbackData?: Data
  fetcher?: Fn
  use?: Middleware[]
  fallback: { [key: string]: any }

  isPaused: () => boolean
  onLoadingSlow: (
    key: string,
    config: Readonly<PublicConfiguration<Data, Error>>
  ) => void
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error>>
  ) => void
  onError: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error>>
  ) => void
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error>>,
    revalidate: Revalidator,
    revalidateOpts: Required<RevalidatorOptions>
  ) => void

  compare: (a: Data | undefined, b: Data | undefined) => boolean

  isOnline: () => boolean
  isVisible: () => boolean
}

export type FullConfiguration = InternalConfiguration & PublicConfiguration

export type ConfigOptions = {
  initFocus: (callback: () => void) => void
  initReconnect: (callback: () => void) => void
}

export type SWRHook = <Data = any, Error = any>(
  ...args:
    | readonly [Key]
    | readonly [Key, Fetcher<Data> | null]
    | readonly [Key, SWRConfiguration<Data, Error> | undefined]
    | readonly [
        Key,
        Fetcher<Data> | null,
        SWRConfiguration<Data, Error> | undefined
      ]
) => SWRResponse<Data, Error>

// Middlewares guarantee that a SWRHook receives a key, fetcher, and config as the argument
type SWRHookWithMiddleware = <Data = any, Error = any>(
  key: Key,
  fetcher: Fetcher<Data> | null,
  config: SWRConfiguration<Data, Error>
) => SWRResponse<Data, Error>

export type Middleware = (useSWRNext: SWRHook) => SWRHookWithMiddleware

export type ValueKey = string | any[] | null

export type MutatorCallback<Data = any> = (
  currentValue?: Data
) => Promise<undefined | Data> | undefined | Data

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

export type Mutator<Data = any> = (
  cache: Cache,
  key: Key,
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>

export interface ScopedMutator<Data = any> {
  /** This is used for bound mutator */
  (
    key: Key,
    data?: Data | Promise<Data> | MutatorCallback<Data>,
    shouldRevalidate?: boolean
  ): Promise<Data | undefined>
  /** This is used for global mutator */
  <T = any>(
    key: Key,
    data?: T | Promise<T> | MutatorCallback<T>,
    shouldRevalidate?: boolean
  ): Promise<T | undefined>
}

export type KeyedMutator<Data> = (
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>

// Public types

export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> = Partial<PublicConfiguration<Data, Error, Fn>>

export type Key = ValueKey | (() => ValueKey)

export interface SWRResponse<Data, Error> {
  data?: Data
  error?: Error
  mutate: KeyedMutator<Data>
  isValidating: boolean
}

export type KeyLoader<Data = any> =
  | ((index: number, previousPageData: Data | null) => ValueKey)
  | null
export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

export type Revalidator = (
  revalidateOpts?: RevalidatorOptions
) => Promise<boolean> | void

export const enum RevalidateEvent {
  FOCUS_EVENT = 0,
  RECONNECT_EVENT = 1,
  MUTATE_EVENT = 2
}

type RevalidateCallbackReturnType = {
  [RevalidateEvent.FOCUS_EVENT]: void
  [RevalidateEvent.RECONNECT_EVENT]: void
  [RevalidateEvent.MUTATE_EVENT]: Promise<boolean>
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
