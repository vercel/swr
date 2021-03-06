// Internal types

export type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

export type Configuration<
  Data = any,
  Error = any,
  Fn extends fetcherFn<Data> = fetcherFn<Data>
> = {
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

  isOnline: () => boolean
  isDocumentVisible: () => boolean
  isPaused: () => boolean
  onLoadingSlow: (key: string, config: Configuration<Data, Error>) => void
  onSuccess: (
    data: Data,
    key: string,
    config: Configuration<Data, Error>
  ) => void
  onError: (err: Error, key: string, config: Configuration<Data, Error>) => void
  onErrorRetry: (
    err: Error,
    key: string,
    config: Configuration<Data, Error>,
    revalidate: Revalidator,
    revalidateOpts: RevalidateOptions
  ) => void
  registerOnFocus?: (cb: () => void) => void
  registerOnReconnect?: (cb: () => void) => void

  compare: (a: Data | undefined, b: Data | undefined) => boolean
}

export type keyType = string | any[] | null
type keyFunction = () => keyType

export type updaterInterface<Data = any, Error = any> = (
  shouldRevalidate?: boolean,
  data?: Data,
  error?: Error,
  shouldDedupe?: boolean,
  dedupe?: boolean
) => boolean | Promise<boolean>
export type triggerInterface = (
  key: Key,
  shouldRevalidate?: boolean
) => Promise<any>
export type mutateCallback<Data = any> = (
  currentValue: undefined | Data
) => Promise<undefined | Data> | undefined | Data
export type mutateInterface<Data = any> = (
  key: Key,
  data?: Data | Promise<Data> | mutateCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>
export type broadcastStateInterface<Data = any, Error = any> = (
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean
) => void

export type actionType<Data, Error> = {
  data?: Data
  error?: Error
  isValidating?: boolean
}

export type cacheListener = () => void

// Public types

/**
 * @deprecated `ConfigInterface` will be renamed to `SWRConfiguration`.
 */
export type ConfigInterface<
  Data = any,
  Error = any,
  Fn extends fetcherFn<Data> = fetcherFn<Data>
> = Partial<Configuration<Data, Error, Fn>>
export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends fetcherFn<Data> = fetcherFn<Data>
> = Partial<Configuration<Data, Error, Fn>>

/**
 * @deprecated `SWRInfiniteConfigInterface` will be renamed to `SWRInfiniteConfiguration`.
 */
export type SWRInfiniteConfigInterface<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, fetcherFn<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}
export type SWRInfiniteConfiguration<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, fetcherFn<Data[]>> & {
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
export type SWRInfiniteResponse<Data = any, Error = any> = SWRResponse<
  Data[],
  Error
> & {
  size: number
  setSize: (
    size: number | ((size: number) => number)
  ) => Promise<Data[] | undefined>
}

/**
 * @deprecated `CacheInterface` will be renamed to `Cache`.
 */
export interface CacheInterface {
  get(key: Key): any
  set(key: Key, value: any): any
  keys(): string[]
  has(key: Key): boolean
  delete(key: Key): void
  clear(): void
  serializeKey(key: Key): [string, any, string, string]
  subscribe(listener: cacheListener): () => void
}
export interface Cache {
  get(key: Key): any
  set(key: Key, value: any): any
  keys(): string[]
  has(key: Key): boolean
  delete(key: Key): void
  clear(): void
  serializeKey(key: Key): [string, any, string, string]
  subscribe(listener: cacheListener): () => void
}

/**
 * @deprecated `RevalidateOptionInterface` will be renamed to `RevalidateOptions`.
 */
export interface RevalidateOptionInterface {
  retryCount?: number
  dedupe?: boolean
}
export interface RevalidateOptions {
  retryCount?: number
  dedupe?: boolean
}

/**
 * @deprecated `keyInterface` will be renamed to `Key`.
 */
export type keyInterface = keyFunction | keyType
export type Key = keyFunction | keyType

/**
 * @deprecated `revalidateType` will be renamed to `Revalidator`.
 */
export type revalidateType = (
  revalidateOpts: RevalidateOptions
) => Promise<boolean>
export type Revalidator = (
  revalidateOpts: RevalidateOptions
) => Promise<boolean>

/**
 * @deprecated `responseInterface` will be renamed to `SWRResponse`.
 */
export type responseInterface<Data, Error> = {
  data?: Data
  error?: Error
  revalidate: () => Promise<boolean>
  mutate: (
    data?: Data | Promise<Data> | mutateCallback<Data>,
    shouldRevalidate?: boolean
  ) => Promise<Data | undefined>
  isValidating: boolean
}
export type SWRResponse<Data, Error> = {
  data?: Data
  error?: Error
  revalidate: () => Promise<boolean>
  mutate: (
    data?: Data | Promise<Data> | mutateCallback<Data>,
    shouldRevalidate?: boolean
  ) => Promise<Data | undefined>
  isValidating: boolean
}
