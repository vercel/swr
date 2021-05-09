export type Fetcher<Data> = (...args: any) => Data | Promise<Data>
export interface Configuration<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> {
  errorRetryInterval: number
  errorRetryCount?: number
  loadingTimeout: number
  focusThrottleInterval: number
  dedupingInterval: number
  refreshInterval: number
  refreshWhenHidden: boolean
  refreshWhenOffline: boolean
  revalidateOnFocus: boolean
  revalidateOnMount?: boolean
  revalidateOnReconnect: boolean
  shouldRetryOnError: boolean
  suspense: boolean
  fetcher: Fn
  initialData?: Data
  cache: Cache

  isPaused: () => boolean
  onLoadingSlow: (
    key: string,
    config: Readonly<Configuration<Data, Error>>
  ) => void
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<Configuration<Data, Error>>
  ) => void
  onError: (
    err: Error,
    key: string,
    config: Readonly<Configuration<Data, Error>>
  ) => void
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<Configuration<Data, Error>>,
    revalidate: Revalidator,
    revalidateOpts: Required<RevalidatorOptions>
  ) => void

  compare: (a: Data | undefined, b: Data | undefined) => boolean
}

export interface Preset {
  isOnline: () => boolean
  isDocumentVisible: () => boolean
  registerOnFocus?: (cb: () => void) => void
  registerOnReconnect?: (cb: () => void) => void
}

export type ValueKey = string | any[] | null

export type Updater<Data = any, Error = any> = (
  shouldRevalidate?: boolean,
  data?: Data,
  error?: Error,
  shouldDedupe?: boolean,
  dedupe?: boolean
) => boolean | Promise<boolean>

export type MutatorCallback<Data = any> = (
  currentValue: undefined | Data
) => Promise<undefined | Data> | undefined | Data

export type Broadcaster<Data = any, Error = any> = (
  cache: Cache,
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

/**
 * @deprecated `ConfigInterface` will be renamed to `SWRConfiguration`.
 */
export type ConfigInterface<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> = Partial<Configuration<Data, Error, Fn>>
export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> = Partial<Configuration<Data, Error, Fn>>

/**
 * @deprecated `keyInterface` will be renamed to `Key`.
 */
export type keyInterface = ValueKey | (() => ValueKey)
export type Key = ValueKey | (() => ValueKey)

/**
 * @deprecated `responseInterface` will be renamed to `SWRResponse`.
 */
export type responseInterface<Data, Error> = {
  data?: Data
  error?: Error
  revalidate: () => Promise<boolean>
  mutate: KeyedMutator<Data>
  isValidating: boolean
}
export interface SWRResponse<Data, Error> {
  data?: Data
  error?: Error
  /**
   * @deprecated `revalidate` is deprecated, please use `mutate()` for the same purpose.
   */
  revalidate: () => Promise<boolean>
  mutate: KeyedMutator<Data>
  isValidating: boolean
}

export type KeyLoader<Data = any> =
  | ((index: number, previousPageData: Data | null) => ValueKey)
  | null

/**
 * @deprecated `SWRInfiniteConfigInterface` will be renamed to `SWRInfiniteConfiguration`.
 */
export type SWRInfiniteConfigInterface<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, Fetcher<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}
export type SWRInfiniteConfiguration<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, Fetcher<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}

/**
 * @deprecated `SWRInfiniteResponseInterface` will be renamed to `SWRInfiniteResponse`.
 */
export type SWRInfiniteResponseInterface<Data = any, Error = any> = SWRResponse<
  Data[],
  Error
> & {
  size: number
  setSize: (
    size: number | ((size: number) => number)
  ) => Promise<Data[] | undefined>
}
export interface SWRInfiniteResponse<Data = any, Error = any>
  extends SWRResponse<Data[], Error> {
  size: number
  setSize: (
    size: number | ((size: number) => number)
  ) => Promise<Data[] | undefined>
}

/**
 * @deprecated `RevalidateOptionInterface` will be renamed to `RevalidatorOptions`.
 */
export interface RevalidateOptionInterface {
  retryCount?: number
  dedupe?: boolean
}
export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

/**
 * @deprecated `revalidateType` will be renamed to `Revalidator`.
 */
export type revalidateType = (
  revalidateOpts: RevalidatorOptions
) => Promise<boolean>
export type Revalidator = (
  revalidateOpts: RevalidatorOptions
) => Promise<boolean>

export interface Cache<Data = any> {
  get(key: Key): Data | null | undefined
  set(key: Key, value: Data): void
  delete(key: Key): void
}
