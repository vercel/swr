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
   *