import type { SWRGlobalConfig } from '../index'
import type * as revalidateEvents from './events'

/**
 * Global state tuple containing SWR's internal state management structures.
 *
 * This is the core state structure that manages all SWR operations internally.
 * Each element serves a specific purpose in the SWR ecosystem.
 *
 * @internal
 */
export type GlobalState = [
  /** Event revalidators: Maps cache keys to arrays of revalidation callbacks */
  Record<string, RevalidateCallback[]>,
  /** Mutation timestamps: Maps cache keys to [start_timestamp, end_timestamp] tuples */
  Record<string, [number, number]>,
  /** Fetch cache: Maps cache keys to [data, timestamp] tuples */
  Record<string, [any, number]>,
  /** Preload cache: Maps cache keys to fetcher responses */
  Record<string, FetcherResponse<any>>,
  /** Scoped mutator function for cache updates */
  ScopedMutator,
  /** Cache setter function with prev/current value comparison */
  (key: string, value: any, prev: any) => void,
  /** Cache subscriber function that returns an unsubscribe function */
  (key: string, callback: (current: any, prev: any) => void) => () => void
]
/**
 * Response type that can be returned by fetcher functions.
 *
 * @template Data - The type of data returned by the fetcher
 * @public
 */
export type FetcherResponse<Data = unknown> = Data | Promise<Data>

/**
 * Basic fetcher function that accepts any arguments and returns data or a promise.
 *
 * This is the most permissive fetcher type, allowing any number of arguments
 * of any type. Used when type safety is not required or when dealing with
 * dynamic fetcher signatures.
 *
 * @template Data - The type of data returned by the fetcher
 * @param args - Variable arguments passed to the fetcher
 * @returns Data or a Promise that resolves to data
 * @public
 */
export type BareFetcher<Data = unknown> = (
  ...args: any[]
) => FetcherResponse<Data>

/**
 * Typed fetcher function that is constrained by the SWR key type.
 *
 * Provides type safety by ensuring the fetcher argument matches the key type.
 * The conditional type logic ensures that:
 * - If the key is a function returning a value, the fetcher receives that value
 * - If the key is falsy (null, undefined, false), the fetcher is never called
 * - Otherwise, the fetcher receives the key directly as its argument
 *
 * @template Data - The type of data returned by the fetcher
 * @template SWRKey - The type of the SWR key, used to infer fetcher arguments
 * @public
 */
export type Fetcher<
  Data = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => infer Arg | null | undefined | false
  ? (arg: Arg) => FetcherResponse<Data>
  : SWRKey extends null | undefined | false
  ? never
  : SWRKey extends infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : never

/**
 * Determines if data should block rendering based on suspense configuration.
 *
 * This conditional type is used internally to determine the return type of `data`
 * in SWRResponse. When suspense is enabled or fallbackData is provided, data
 * will never be undefined, allowing for non-nullable return types.
 *
 * The type resolution follows this logic:
 * 1. If global suspense is enabled → `true` (data never undefined)
 * 2. If no options provided → `false` (data can be undefined)
 * 3. If suspense is enabled in options → `true` (data never undefined)
 * 4. If fallbackData is provided → `true` (data never undefined)
 * 5. Otherwise → `false` (data can be undefined)
 *
 * @template Data - The data type
 * @template Options - The SWR configuration options
 * @returns `true` if data is guaranteed to be defined, `false` if it can be undefined
 * @internal
 */
export type BlockingData<
  Data = any,
  Options = SWRDefaultOptions<Data>
> = SWRGlobalConfig extends { suspense: true }
  ? true
  : Options extends undefined
  ? false
  : Options extends { suspense: true }
  ? true
  : Options extends { fallbackData: Data | Promise<Data> }
  ? true
  : false

/**
 * Configuration types that are only used internally, not exposed to the user.
 *
 * These options are managed internally by SWR and passed between internal
 * functions. They are not part of the public API and should not be used
 * directly by consumers.
 *
 * @internal
 */
export interface InternalConfiguration {
  /** The cache instance used to store SWR data and state */
  cache: Cache
  /** Scoped mutator function for updating cache entries */
  mutate: ScopedMutator
}

/**
 * Public configuration options for SWR.
 *
 * This interface defines all the configuration options that users can pass
 * to customize SWR's behavior. These options can be provided globally via
 * SWRConfig or per-hook via the config parameter.
 *
 * @template Data - The type of data returned by the fetcher
 * @template Error - The type of error that can be thrown
 * @template Fn - The fetcher function type
 *
 * @public
 * @see {@link https://swr.vercel.app/docs/options | SWR Options Documentation}
 */
export interface PublicConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher = BareFetcher
> {
  /**
   *  error retry interval in milliseconds
   *  @defaultValue 5000
   */
  errorRetryInterval: number
  /** max error retry count */
  errorRetryCount?: number
  /**
   * timeout to trigger the onLoadingSlow event in milliseconds
   * @defaultValue 3000
   */
  loadingTimeout: number
  /**
   * only revalidate once during a time span in milliseconds
   * @defaultValue 5000
   */
  focusThrottleInterval: number
  /**
   * dedupe requests with the same key in this time span in milliseconds
   * @defaultValue 2000
   */
  dedupingInterval: number
  /**
   *  * Disabled by default: `refreshInterval = 0`
   *  * If set to a number, polling interval in milliseconds
   *  * If set to a function, the function will receive the latest data and should return the interval in milliseconds
   *  @see {@link https://swr.vercel.app/docs/revalidation}
   */
  refreshInterval?: number | ((latestData: Data | undefined) => number)
  /**
   * polling when the window is invisible (if `refreshInterval` is enabled)
   * @defaultValue false
   */
  refreshWhenHidden?: boolean
  /**
   * polling when the browser is offline (determined by `navigator.onLine`)
   *
   * When enabled, SWR will continue polling even when the browser is offline.
   * This can be useful for applications that need to check for connectivity
   * or cache updates while offline.
   *
   * @defaultValue false
   */
  refreshWhenOffline?: boolean
  /**
   * automatically revalidate when window gets focused
   *
   * When enabled, SWR will automatically revalidate data when the user
   * returns focus to the window/tab. This ensures data freshness when
   * users switch between applications.
   *
   * @defaultValue true
   * @see {@link https://swr.vercel.app/docs/revalidation | Revalidation Documentation}
   */
  revalidateOnFocus: boolean
  /**
   * automatically revalidate when the browser regains a network connection (via `navigator.onLine`)
   *
   * When enabled, SWR will automatically revalidate data when the browser
   * goes from offline to online state, ensuring data is up-to-date when
   * connectivity is restored.
   *
   * @defaultValue true
   * @see {@link https://swr.vercel.app/docs/revalidation | Revalidation Documentation}
   */
  revalidateOnReconnect: boolean
  /**
   * enable or disable automatic revalidation when component is mounted
   *
   * Controls whether SWR should automatically fetch data when the component
   * mounts. When `undefined`, the behavior depends on `revalidateIfStale`.
   *
   * @defaultValue undefined (inherits from revalidateIfStale)
   */
  revalidateOnMount?: boolean
  /**
   * automatically revalidate even if there is stale data
   * @defaultValue true
   * @see {@link https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations}
   */
  revalidateIfStale: boolean
  /**
   * retry when fetcher has an error
   * @defaultValue true
   */
  shouldRetryOnError: boolean | ((err: Error) => boolean)
  /**
   * keep the previous result when key is changed but data is not ready
   * @defaultValue false
   */
  keepPreviousData?: boolean
  /**
   * @experimental  enable React Suspense mode
   * @defaultValue false
   * @see {@link https://swr.vercel.app/docs/suspense}
   */
  suspense?: boolean
  /**
   * initial data to be returned (note: ***This is per-hook***)
   * @see {@link https://swr.vercel.app/docs/with-nextjs}
   */
  fallbackData?: Data | Promise<Data>
  /**
   * warns when preload data is missing for a given key, this includes fallback
   * data, preload calls, or initial data from the cache provider
   * @defaultValue false
   */
  strictServerPrefetchWarning?: boolean
  /**
   * the fetcher function
   */
  fetcher?: Fn
  /**
   * array of middleware functions
   * @see {@link https://swr.vercel.app/docs/middleware}
   */
  use?: Middleware[]
  /**
   * a key-value object of multiple fallback data
   * @see {@link https://swr.vercel.app/docs/with-nextjs#pre-rendering-with-default-data}
   */
  fallback: { [key: string]: any }
  /**
   * Function to detect whether pause revalidations, will ignore fetched data and errors when it returns true. Returns false by default.
   */
  isPaused: () => boolean
  /**
   * callback function when a request takes too long to load (see `loadingTimeout`)
   */
  onLoadingSlow: (
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * callback function when a request finishes successfully
   */
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * callback function when a request returns an error
   */
  onError: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * handler for error retry
   */
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>,
    revalidate: Revalidator,
    revalidateOpts: Required<RevalidatorOptions>
  ) => void
  /**
   * callback function when a request is ignored due to race conditions
   */
  onDiscarded: (key: string) => void
  /**
   * Comparison function used to detect when returned data has changed, to avoid spurious rerenders. By default, [dequal](https://github.com/lukeed/dequal) is used.
   */
  compare: (a: Data | undefined, b: Data | undefined) => boolean
  /**
   * IsOnline and isVisible are functions that return a boolean, to determine if the application is "active". By default, SWR will bail out a revalidation if these conditions are not met.
   * @see {@link https://swr.vercel.app/docs/advanced/react-native#customize-focus-and-reconnect-events}
   */
  isOnline: () => boolean
  /**
   * IsOnline and isVisible are functions that return a boolean, to determine if the application is "active". By default, SWR will bail out a revalidation if these conditions are not met.
   * @see {@link https://swr.vercel.app/docs/advanced/react-native#customize-focus-and-reconnect-events}
   */
  isVisible: () => boolean
}

export type FullConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher = BareFetcher
> = InternalConfiguration & PublicConfiguration<Data, Error, Fn>

/**
 * Provider configuration for custom focus and reconnect event handling.
 *
 * This configuration allows custom implementations for detecting window focus
 * and network reconnection events. Useful for React Native or other environments
 * where the default browser APIs are not available.
 *
 * @public
 * @see {@link https://swr.vercel.app/docs/advanced/react-native | React Native Documentation}
 */
export type ProviderConfiguration = {
  /**
   * Initialize focus event listener.
   *
   * @param callback - Function to call when window gains focus
   * @returns Optional cleanup function to remove the listener
   */
  initFocus: (callback: () => void) => (() => void) | void
  /**
   * Initialize reconnect event listener.
   *
   * @param callback - Function to call when network reconnects
   * @returns Optional cleanup function to remove the listener
   */
  initReconnect: (callback: () => void) => (() => void) | void
}

/**
 * The main useSWR hook interface with multiple overloads for different usage patterns.
 *
 * This interface provides type-safe overloads for various ways to call useSWR,
 * from simple key-only calls to complex configurations with custom fetchers.
 * The overloads ensure proper type inference for data, error, and configuration.
 *
 * @public
 *
 * @example Basic usage
 * ```ts
 * const { data, error } = useSWR('/api/data', fetcher)
 * ```
 *
 * @example With configuration
 * ```ts
 * const { data, error } = useSWR('/api/data', fetcher, {
 *   refreshInterval: 1000,
 *   revalidateOnFocus: false
 * })
 * ```
 *
 * @example Conditional fetching
 * ```ts
 * const { data, error } = useSWR(
 *   user.id ? `/api/user/${user.id}` : null,
 *   fetcher
 * )
 * ```
 *
 * @example Dynamic key with function
 * ```ts
 * const { data, error } = useSWR(
 *   () => user.id ? [`/api/user/${user.id}`, user.token] : null,
 *   ([url, token]) => fetcher(url, { headers: { Authorization: token } })
 * )
 * ```
 */
export interface SWRHook {
  /**
   * Basic usage with just a key. Requires a global fetcher to be configured,
   * or can be used for client-side state management without fetching.
   *
   * @example
   * ```ts
   * // With global fetcher
   * const { data } = useSWR('/api/user')
   *
   * // Client state management
   * const { data, mutate } = useSWR('user-settings')
   * mutate({ theme: 'dark' })
   * ```
   */
  <Data = any, Error = any, SWRKey extends Key = StrictKey>(
    key: SWRKey
  ): SWRResponse<Data, Error>

  /**
   * Most common usage pattern with key and explicit fetcher function.
   * The fetcher receives the key as its argument and returns the data.
   *
   * @example
   * ```ts
   * const { data, error } = useSWR('/api/user/123',
   *   (url) => fetch(url).then(res => res.json())
   * )
   * ```
   */
  <Data = any, Error = any, SWRKey extends Key = StrictKey>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>

  /**
   * Key with fetcher using relaxed key constraints for dynamic or complex keys.
   * Allows more flexible key types including functions and objects.
   *
   * @example
   * ```ts
   * const { data } = useSWR(
   *   () => user ? ['/api/posts', user.id] : null,
   *   ([url, userId]) => fetchUserPosts(url, userId)
   * )
   * ```
   */
  <Data = any, Error = any, SWRKey extends Key = Key>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>

  /**
   * Key-only with advanced configuration options and strict typing.
   * Useful when you need specific SWR options but rely on a global fetcher.
   *
   * @example
   * ```ts
   * const { data } = useSWR<User>('/api/user', {
   *   refreshInterval: 5000,
   *   revalidateOnFocus: false
   * })
   * ```
   */
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Key with fetcher and advanced configuration options with strict typing.
   * Provides full control over fetching behavior and SWR options.
   *
   * @example
   * ```ts
   * const { data } = useSWR('/api/data', fetcher, {
   *   suspense: true,
   *   fallbackData: initialData
   * })
   * ```
   */
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Key with configuration object but no explicit fetcher. Uses global fetcher
   * or can be used for pure client state management with configuration.
   *
   * @example
   * ```ts
   * // With global fetcher and config
   * const { data } = useSWR('/api/user', {
   *   refreshInterval: 1000
   * })
   *
   * // Client state with config
   * const { data } = useSWR('local-state', {
   *   fallbackData: defaultValue
   * })
   * ```
   */
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Complete signature with key, fetcher, and configuration options.
   * Provides maximum flexibility and control over all SWR behavior.
   *
   * @example
   * ```ts
   * const { data, error, isLoading } = useSWR(
   *   '/api/user',
   *   async (url) => {
   *     const res = await fetch(url)
   *     if (!res.ok) throw new Error('Failed to fetch')
   *     return res.json()
   *   },
   *   {
   *     refreshInterval: 5000,
   *     onError: (error) => console.error('SWR Error:', error),
   *     fallbackData: { name: 'Loading...' }
   *   }
   * )
   * ```
   */
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Simple key-only usage with flexible key types. Most permissive overload
   * that accepts any valid key format.
   *
   * @example
   * ```ts
   * const { data } = useSWR('/api/data')
   * const { data: userData } = useSWR(['user', userId])
   * const { data: settings } = useSWR({ endpoint: '/settings', version: 'v1' })
   * ```
   */
  <Data = any, Error = any>(key: Key): SWRResponse<Data, Error>

  /**
   * Key-only with configuration options using bare fetcher constraints.
   * Suitable for cases where fetcher type safety is less important.
   *
   * @example
   * ```ts
   * const { data } = useSWR('/api/data', {
   *   dedupingInterval: 5000
   * })
   * ```
   */
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Key with bare fetcher function that accepts any arguments.
   * Provides less type safety but maximum flexibility for fetcher signatures.
   *
   * @example
   * ```ts
   * const { data } = useSWR('/api/user',
   *   (...args) => customFetcher(...args)
   * )
   * ```
   */
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    fetcher: BareFetcher<Data> | null
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Key with configuration using relaxed fetcher typing constraints.
   * Useful when working with dynamic or loosely-typed fetcher functions.
   *
   * @example
   * ```ts
   * const { data } = useSWR(dynamicKey, {
   *   fetcher: customFetcher,
   *   refreshInterval: 2000
   * })
   * ```
   */
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>

  /**
   * Complete signature with key, bare fetcher, and configuration.
   * Most flexible overload with minimal type constraints, suitable for
   * complex scenarios where strict typing isn't feasible.
   *
   * @example
   * ```ts
   * const { data } = useSWR(
   *   complexKey,
   *   (...args) => legacyFetcher(...args),
   *   {
   *     refreshInterval: 10000,
   *     errorRetryCount: 3
   *   }
   * )
   * ```
   */
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    fetcher: BareFetcher<Data> | null,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>
}

/**
 * Middleware function type for extending SWR functionality.
 *
 * Middleware functions receive the next SWR hook in the chain and return
 * a modified hook function. This allows for composition of multiple
 * middleware functions to add features like logging, caching, or
 * request/response transformation.
 *
 * The middleware guarantees that a SWRHook receives a key, fetcher,
 * and config as arguments, providing a consistent interface for
 * middleware authors.
 *
 * @param useSWRNext - The next SWR hook function in the middleware chain
 * @returns A new SWR hook function with middleware functionality applied
 *
 * @template Data - The type of data returned by the fetcher
 * @template Error - The type of error that can be thrown
 *
 * @public
 * @see {@link https://swr.vercel.app/docs/middleware | Middleware Documentation}
 *
 * @example
 * ```ts
 * const logger: Middleware = (useSWRNext) => (key, fetcher, config) => {
 *   console.log('SWR Request:', key)
 *   return useSWRNext(key, fetcher, config)
 * }
 * ```
 */
export type Middleware = (
  useSWRNext: SWRHook
) => <Data = any, Error = any>(
  key: Key,
  fetcher: BareFetcher<Data> | null,
  config: SWRConfiguration<Data, Error, BareFetcher<Data>>
) => SWRResponse<Data, Error>

/**
 * Represents a tuple of arguments that can be passed to a fetcher.
 *
 * The first element is typically the primary key (like a URL), followed
 * by additional parameters that affect the request (like query parameters,
 * headers, or request options).
 *
 */
type ArgumentsTuple = readonly [any, ...unknown[]]

/**
 * Valid types for SWR keys.
 *
 * SWR keys identify unique requests and can be:
 * - `string`: Simple URL or identifier
 * - `ArgumentsTuple`: Array with URL and additional parameters
 * - `Record<any, any>`: Object that will be serialized
 * - `null | undefined | false`: Falsy values disable the request
 *
 * When a key is falsy, SWR will not make the request, allowing for
 * conditional fetching based on application state.
 *
 * @public
 *
 * @example
 * ```ts
 * // String key
 * useSWR('/api/users', fetcher)
 *
 * // Array key with parameters
 * useSWR(['/api/user', userId], ([url, id]) => fetcher(`${url}/${id}`))
 *
 * // Object key
 * useSWR({ url: '/api/data', params: { page: 1 } }, fetcher)
 *
 * // Conditional key
 * useSWR(userId ? `/api/user/${userId}` : null, fetcher)
 * ```
 */
export type Arguments =
  | string
  | ArgumentsTuple
  | Record<any, any>
  | null
  | undefined
  | false

/**
 * SWR key that can be static or a function that returns arguments.
 *
 * When a function is provided, it's called on each render to determine
 * the current key. This allows for dynamic keys based on component state
 * or props.
 *
 * @public
 *
 * @example
 * ```ts
 * // Static key
 * useSWR('/api/data', fetcher)
 *
 * // Dynamic key function
 * useSWR(() => user ? `/api/user/${user.id}` : null, fetcher)
 * ```
 */
export type Key = Arguments | (() => Arguments)

/**
 * Strict tuple key type that only allows tuples or falsy values.
 *
 * @internal
 */
export type StrictTupleKey = ArgumentsTuple | null | undefined | false

/**
 * Strict key type for internal use.
 *
 * @internal
 */
type StrictKey = StrictTupleKey | (() => StrictTupleKey)
/**
 * Callback function type for mutator operations.
 *
 * This function receives the current cached data and can return new data
 * to update the cache. It can be synchronous or asynchronous, and can
 * return undefined to indicate no change should be made.
 *
 * @template Data - The type of the cached data
 * @param currentData - The current data in the cache (may be undefined)
 * @returns New data to set, undefined for no change, or a Promise resolving to either
 *
 * @public
 *
 * @example
 * ```ts
 * // Increment a counter
 * mutate(key, (current: number = 0) => current + 1)
 *
 * // Async update
 * mutate(key, async (current) => {
 *   const updated = await updateData(current)
 *   return updated
 * })
 * ```
 */
export type MutatorCallback<Data = any> = (
  currentData?: Data
) => Promise<undefined | Data> | undefined | Data

/**
 * Options for configuring mutator behavior.
 *
 * These options control how the mutation affects the cache, revalidation,
 * and error handling behavior.
 *
 * @template Data - The type of the data related to the key
 * @template MutationData - The type of the data returned by the mutator
 *
 * @public
 */
export type MutatorOptions<Data = any, MutationData = Data> = {
  /**
   * Whether to revalidate the cache after mutation.
   *
   * Can be a boolean or a function that receives the new data and key
   * to determine whether revalidation should occur.
   *
   * @defaultValue true
   */
  revalidate?: boolean | ((data: Data, key: Arguments) => boolean)

  /**
   * Whether and how to populate the cache with mutation results.
   *
   * - `false`: Don't update the cache
   * - `true`: Update cache with mutation result directly
   * - Function: Transform mutation result before caching
   *
   * @defaultValue true
   */
  populateCache?:
    | boolean
    | ((result: MutationData, currentData: Data | undefined) => Data)

  /**
   * Optimistic data to show immediately while mutation is pending.
   *
   * Can be the data directly or a function that computes it based on
   * current and displayed data. Useful for immediate UI feedback.
   *
   * @defaultValue undefined
   */
  optimisticData?:
    | Data
    | ((currentData: Data | undefined, displayedData: Data | undefined) => Data)

  /**
   * Whether to rollback optimistic updates on error.
   *
   * Can be a boolean or a function that receives the error to determine
   * whether rollback should occur.
   *
   * @defaultValue true
   */
  rollbackOnError?: boolean | ((error: unknown) => boolean)

  /**
   * Whether to throw errors instead of returning them in the error field.
   *
   * When true, errors will be thrown and can be caught with try/catch.
   * When false, errors are returned in the response object.
   *
   * @defaultValue false
   */
  throwOnError?: boolean
  includeSpecialKeys?: boolean
}

export type MutatorConfig = {
  revalidate?: boolean
  populateCache?: boolean
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

/**
 * Internal state structure stored in the cache.
 *
 * This represents the complete state for a cache entry, including
 * data, error, and loading states. All fields are optional as they
 * may not be present depending on the request lifecycle.
 *
 * @template Data - The type of data stored
 * @template Error - The type of error that can occur
 *
 * @internal
 */
export type State<Data = any, Error = any> = {
  /** The cached data, if available */
  data?: Data
  /** The error object, if an error occurred */
  error?: Error
  /** Whether a revalidation is currently in progress */
  isValidating?: boolean
  /** Whether this is the initial load with no cached data */
  isLoading?: boolean
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

export interface ScopedMutator {
  /**
   * @typeParam Data - The type of the data related to the key
   * @typeParam MutationData - The type of the data returned by the mutator
   */
  <Data = any, MutationData = Data>(
    matcher: (key?: Arguments) => boolean,
    data?: MutationData | Promise<MutationData> | MutatorCallback<MutationData>,
    opts?: boolean | MutatorOptions<Data, MutationData>
  ): Promise<Array<MutationData | undefined>>
  /**
   * @typeParam Data - The type of the data related to the key
   * @typeParam MutationData - The type of the data returned by the mutator
   */
  <Data = any, T = Data>(
    key: Arguments,
    data?: T | Promise<T> | MutatorCallback<T>,
    opts?: boolean | MutatorOptions<Data, T>
  ): Promise<T | undefined>
}

/**
 * @typeParam Data - The type of the data related to the key
 * @typeParam MutationData - The type of the data returned by the mutator
 */
export type KeyedMutator<Data> = <MutationData = Data>(
  data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
  opts?: boolean | MutatorOptions<Data, MutationData>
) => Promise<Data | MutationData | undefined>

export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends BareFetcher<any> = BareFetcher<any>
> = Partial<PublicConfiguration<Data, Error, Fn>> &
  Partial<ProviderConfiguration> & {
    provider?: (cache: Readonly<Cache>) => Cache
  }

export type IsLoadingResponse<
  Data = any,
  Options = SWRDefaultOptions<Data>
> = SWRGlobalConfig extends { suspense: true }
  ? Options extends { suspense: true }
    ? false
    : false
  : boolean

type SWRDefaultOptions<Data> = SWRConfiguration<Data, Error, Fetcher<Data, Key>>
type SWRConfigurationWithOptionalFallback<Options> =
  // If `Options` has `fallbackData`, this turns it to optional instead.
  Options extends SWRConfiguration &
    Required<Pick<SWRConfiguration, 'fallbackData'>>
    ? Omit<Options, 'fallbackData'> & Pick<Partial<Options>, 'fallbackData'>
    : Options

/**
 * The response object returned by SWR hooks.
 *
 * This interface represents the return value of useSWR and related hooks,
 * providing access to data, error state, and control functions.
 *
 * @template Data - The type of data returned by the fetcher
 * @template Error - The type of error that can be thrown
 * @template Config - The configuration type used to determine blocking behavior
 *
 * @public
 */
export interface SWRResponse<Data = any, Error = any, Config = any> {
  /**
   * The data returned by the fetcher function.
   *
   * - When suspense is enabled or fallbackData is provided: always defined
   * - Otherwise: `undefined` during initial load or when key is falsy
   */
  data: BlockingData<Data, Config> extends true ? Data : Data | undefined

  /**
   * The error object thrown by the fetcher function.
   *
   * `undefined` when there's no error or when a request is in progress.
   */
  error: Error | undefined

  /**
   * Function to mutate the cached data for this specific key.
   *
   * This is a bound version of the global mutate function that automatically
   * uses the current key, providing type safety and convenience.
   */
  mutate: KeyedMutator<Data>

  /**
   * Whether the request is currently being validated (loading fresh data).
   *
   * `true` during initial load, revalidation, or when mutate is called
   * with a promise or async function.
   */
  isValidating: boolean

  /**
   * Whether the request is in initial loading state.
   *
   * `true` only during the initial load when there's no cached data.
   * Unlike `isValidating`, this becomes `false` once data is available.
   */
  isLoading: IsLoadingResponse<Data, Config>
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
  | typeof revalidateEvents.ERROR_REVALIDATE_EVENT
type RevalidateCallbackReturnType = {
  [revalidateEvents.FOCUS_EVENT]: void
  [revalidateEvents.RECONNECT_EVENT]: void
  [revalidateEvents.MUTATE_EVENT]: Promise<boolean>
  [revalidateEvents.ERROR_REVALIDATE_EVENT]: void
}
export type RevalidateCallback = <K extends RevalidateEvent>(
  type: K,
  opts?: any
) => RevalidateCallbackReturnType[K]

/**
 * Cache interface for storing SWR state.
 *
 * This interface defines the contract for cache providers used by SWR.
 * The default implementation uses a Map, but custom cache providers
 * can implement this interface to provide different storage mechanisms.
 *
 * @template Data - The type of data stored in the cache
 *
 * @public
 * @see {@link https://swr.vercel.app/docs/advanced/cache | Cache Documentation}
 */
export interface Cache<Data = any> {
  /**
   * Get an iterator of all cache keys.
   *
   * @returns Iterator that yields all cache keys as strings
   */
  keys(): IterableIterator<string>

  /**
   * Get the cached state for a key.
   *
   * @param key - The cache key to look up
   * @returns The cached state or undefined if not found
   */
  get(key: string): State<Data> | undefined

  /**
   * Set the cached state for a key.
   *
   * @param key - The cache key to set
   * @param value - The state to cache
   */
  set(key: string, value: State<Data>): void

  /**
   * Delete a cached entry.
   *
   * @param key - The cache key to delete
   */
  delete(key: string): void
}

export interface StateDependencies {
  data?: boolean
  error?: boolean
  isValidating?: boolean
  isLoading?: boolean
}
