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
    revalidate: revalidateType,
    revalidateOpts: RevalidateOptionInterface
  ) => void
  registerOnFocus?: (cb: () => void) => void
  registerOnReconnect?: (cb: () => void) => void

  compare: (a: Data | undefined, b: Data | undefined) => boolean
}

export interface RevalidateOptionInterface {
  retryCount?: number
  dedupe?: boolean
}

export type keyType = string | any[] | null
type keyFunction = () => keyType
export type keyInterface = keyFunction | keyType
export type updaterInterface<Data = any, Error = any> = (
  shouldRevalidate?: boolean,
  data?: Data,
  error?: Error,
  shouldDedupe?: boolean,
  dedupe?: boolean
) => boolean | Promise<boolean>
export type triggerInterface = (
  key: keyInterface,
  shouldRevalidate?: boolean
) => Promise<any>
export type mutateCallback<Data = any> = (
  currentValue: undefined | Data
) => Promise<undefined | Data> | undefined | Data
export type mutateInterface<Data = any> = (
  key: keyInterface,
  data?: Data | Promise<Data> | mutateCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>
export type broadcastStateInterface<Data = any, Error = any> = (
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean
) => void
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
export type revalidateType = (
  revalidateOpts: RevalidateOptionInterface
) => Promise<boolean>

export type actionType<Data, Error> = {
  data?: Data
  error?: Error
  isValidating?: boolean
}

export interface CacheInterface {
  get(key: keyInterface): any
  set(key: keyInterface, value: any): any
  keys(): string[]
  has(key: keyInterface): boolean
  delete(key: keyInterface): void
  clear(): void
  serializeKey(key: keyInterface): [string, any, string, string]
  subscribe(listener: cacheListener): () => void
}

export type cacheListener = () => void

// Public types

export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends fetcherFn<Data> = fetcherFn<Data>
> = Partial<Configuration<Data, Error, Fn>>
/**
 * @deprecated `ConfigInterface` will be renamed to `SWRConfiguration`.
 */
export type ConfigInterface<
  Data = any,
  Error = any,
  Fn extends fetcherFn<Data> = fetcherFn<Data>
> = Partial<Configuration<Data, Error, Fn>>

export type SWRInfiniteConfiguration<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, fetcherFn<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}
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

export type SWRInfiniteResponse<Data = any, Error = any> = responseInterface<
  Data[],
  Error
> & {
  size: number
  setSize: (
    size: number | ((size: number) => number)
  ) => Promise<Data[] | undefined>
}
/**
 * @deprecated `SWRInfiniteResponseInterface` will be renamed to `SWRInfiniteResponse`.
 */
export type SWRInfiniteResponseInterface<
  Data = any,
  Error = any
> = responseInterface<Data[], Error> & {
  size: number
  setSize: (
    size: number | ((size: number) => number)
  ) => Promise<Data[] | undefined>
}
