Fetcher<Data> = (...args: any) = > | Promise.
<DConfiguration<
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

 Preset {
  isOnline: () => boolean
  isDocumentVisible: () => boolean
  registerOnFocus?: (cb: () => void) => void
  registerOnReconnect?: (cb: () => void) => void
}

 ValueKey = string | any[] | null

 Updater<Data = any, = any> = (
  shouldRevalidate?: boolean,
  data?: Data,
  error?: Error,
  shouldDedupe?: boolean,
  dedupe?: boolean
) => boolean | Promise<boolean>

 MutatorCallback< = any> = (
  currentValue: undefined | Data
) => Promise<undefined | Data> | undefined | Data

 Broadcaster<Data = any, = any> = (
  cache: Cache,
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean,
  shouldRevalidate?: boolean
) => Promise<Data>

 State<Data, Error> = {
  data?: Data
  error?: Error
  isValidating?: boolean
}

 Mutator<Data = any> = (
  cache: Cache,
  key: Key,
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>

 ScopedMutator<Data = any> {
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

 KeyedMutator<Data> = (
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  shouldRevalidate?: boolean
) => Promise<Data | undefined>

// Public types

/**
 * @deprecated `ConfigInterface` will be renamed to `SWRConfiguration`.
 */
 ConfigInterface<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> = Partial<Configuration<Data, Error, Fn>>
 SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher<Data> = Fetcher<Data>
> = Partial<Configuration<Data, Error, Fn>>

/**
 * @deprecated `keyInterface` will be renamed to `Key`.
 */
 keyInterface = ValueKey | (() => ValueKey)
 Key = ValueKey | (() => ValueKey)

/**
 * @deprecated `responseInterface` will be renamed to `SWRResponse`.
 */
 responseInterface<Data, Error> = {
  data?: Data
  error?: Error
  revalidate: () => Promise<boolean>
  mutate: KeyedMutator<Data>
  isValidating: boolean
}
 SWRResponse<Data, Error> {
  data?: Data
  error?: Error
  /**
   * @deprecated `revalidate` is deprecated, please use `mutate()` for the same purpose.
   */
  revalidate: () => Promise<boolean>
  mutate: KeyedMutator<Data>
  isValidating: boolean
}

 KeyLoader<Data = any> =
  | ((index: number, previousPageData: Data | null) => ValueKey)
  | null

/**
 * @deprecated `SWRInfiniteConfigInterface` will be renamed to `SWRInfiniteConfiguration`.
 */
 SWRInfiniteConfigInterface<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, Fetcher<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}
 SWRInfiniteConfiguration<
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
 SWRInfiniteResponseInterface<Data = any, Error = any> = SWRResponse<
  Data[],
  Error
> & {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
}
 SWRInfiniteResponse<Data = any, Error = any>
  extends SWRResponse<Data[], Error> {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
}

/**
 * @deprecated `RevalidateOptionInterface` will be renamed to `RevalidatorOptions`.
 */
 RevalidateOptionInterface {
  retryCount?: number
  dedupe?: boolean
}
 RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

/**
 * @deprecated `revalidateType` will be renamed to `Revalidator`.
 */
 revalidateType = (
  revalidateOpts: RevalidatorOptions
) => Promise<boolean>
 Revalidator = (
  revalidateOpts: RevalidatorOptions
) => Promise<boolean>

 Cache<Data = any> {
  get(key: Key): Data | null | undefined
  set(key: Key, value: Data): void
  delete(key: Key): void
}
