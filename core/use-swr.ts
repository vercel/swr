import { useCallback, useRef, useDebugValue, useMemo } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'

import {
  defaultConfig,
  IS_REACT_LEGACY,
  IS_SERVER,
  rAF,
  useIsomorphicLayoutEffect,
  SWRGlobalState,
  serialize,
  isUndefined,
  UNDEFINED,
  OBJECT,
  isFunction,
  createCacheHelper,
  SWRConfig as ConfigProvider,
  withArgs,
  subscribeCallback,
  getTimestamp,
  internalMutate,
  revalidateEvents,
  mergeObjects
} from 'swr/_internal'
import type {
  State,
  Fetcher,
  Key,
  SWRResponse,
  RevalidatorOptions,
  FullConfiguration,
  SWRConfiguration,
  SWRHook,
  RevalidateEvent,
  StateDependencies,
  GlobalState
} from 'swr/_internal'

const WITH_DEDUPE = { dedupe: true }

type DefinitelyTruthy<T> = false extends T
  ? never
  : 0 extends T
  ? never
  : '' extends T
  ? never
  : null extends T
  ? never
  : undefined extends T
  ? never
  : T

export const useSWRHandler = <Data = any, Error = any>(
  _key: Key,
  fetcher: Fetcher<Data> | null,
  config: typeof defaultConfig & SWRConfiguration<Data, Error>
) => {
  const {
    cache,
    compare,
    suspense,
    fallbackData,
    revalidateOnMount,
    refreshInterval,
    refreshWhenHidden,
    refreshWhenOffline,
    keepPreviousData
  } = config

  const [EVENT_REVALIDATORS, MUTATION, FETCH] = SWRGlobalState.get(
    cache
  ) as GlobalState

  // `key` is the identifier of the SWR `data` state, `keyInfo` holds extra
  // states such as `error` and `isValidating` inside,
  // all of them are derived from `_key`.
  // `fnArg` is the argument/arguments parsed from the key, which will be passed
  // to the fetcher.
  const [key, fnArg] = serialize(_key)

  // If it's the initial render of this hook.
  const initialMountedRef = useRef(false)

  // If the hook is unmounted already. This will be used to prevent some effects
  // to be called after unmounting.
  const unmountedRef = useRef(false)

  // Refs to keep the key and config.
  const keyRef = useRef(key)
  const fetcherRef = useRef(fetcher)
  const configRef = useRef(config)
  const getConfig = () => configRef.current
  const isActive = () => getConfig().isVisible() && getConfig().isOnline()

  const [getCache, setCache, subscribeCache] = createCacheHelper<
    Data,
    State<Data, any> & {
      // The original key arguments.
      _k?: Key
    }
  >(cache, key)

  const stateDependencies = useRef<StateDependencies>({}).current

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fallback = isUndefined(fallbackData)
    ? config.fallback[key]
    : fallbackData

  const isEqual = (prev: State<Data, any>, current: State<Data, any>) => {
    let equal = true
    for (const _ in stateDependencies) {
      const t = _ as keyof StateDependencies
      if (!compare(current[t], prev[t])) {
        if (t === 'data' && isUndefined(prev[t])) {
          if (!compare(current[t], returnedData)) {
            equal = false
          }
        } else {
          equal = false
        }
      }
    }
    return equal
  }

  const getSnapshot = useMemo(() => {
    const shouldStartRequest = (() => {
      if (!key) return false
      if (!fetcher) return false
      // If `revalidateOnMount` is set, we take the value directly.
      if (!isUndefined(revalidateOnMount)) return revalidateOnMount
      // If it's paused, we skip revalidation.
      if (getConfig().isPaused()) return false
      if (suspense) return false
      return true
    })()

    const getSelectedCache = () => {
      const state = getCache()

      // We only select the needed fields from the state.
      const snapshot = mergeObjects(state)
      delete snapshot._k

      if (!shouldStartRequest) {
        return snapshot
      }

      return {
        isValidating: true,
        isLoading: true,
        ...snapshot
      }
    }

    let memorizedSnapshot = getSelectedCache()

    return () => {
      const snapshot = getSelectedCache()
      return isEqual(snapshot, memorizedSnapshot)
        ? memorizedSnapshot
        : (memorizedSnapshot = snapshot)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, key])

  // Get the current state that SWR should return.
  const cached = useSyncExternalStore(
    useCallback(
      (callback: () => void) =>
        subscribeCache(
          key,
          (prev: State<Data, any>, current: State<Data, any>) => {
            if (!isEqual(prev, current)) callback()
          }
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [cache, key]
    ),
    getSnapshot,
    getSnapshot
  )

  const isInitialMount = !initialMountedRef.current
  const cachedData = cached.data

  const data = isUndefined(cachedData) ? fallback : cachedData
  const error = cached.error

  // Use a ref to store previously returned data. Use the initial data as its initial value.
  const laggyDataRef = useRef(data)

  const returnedData = keepPreviousData
    ? isUndefined(cachedData)
      ? laggyDataRef.current
      : cachedData
    : data

  // - Suspense mode and there's stale data for the initial render.
  // - Not suspense mode and there is no fallback data and `revalidateIfStale` is enabled.
  // - `revalidateIfStale` is enabled but `data` is not defined.
  const shouldDoInitialRevalidation = (() => {
    // If `revalidateOnMount` is set, we take the value directly.
    if (isInitialMount && !isUndefined(revalidateOnMount))
      return revalidateOnMount

    // If it's paused, we skip revalidation.
    if (getConfig().isPaused()) return false

    // Under suspense mode, it will always fetch on render if there is no
    // stale data so no need to revalidate immediately mount it again.
    // If data exists, only revalidate if `revalidateIfStale` is true.
    if (suspense) return isUndefined(data) ? false : config.revalidateIfStale

    // If there is no stale data, we need to revalidate when mount;
    // If `revalidateIfStale` is set to true, we will always revalidate.
    return isUndefined(data) || config.revalidateIfStale
  })()

  // Resolve the default validating state:
  // If it's able to validate, and it should revalidate when mount, this will be true.
  const defaultValidatingState = !!(
    key &&
    fetcher &&
    isInitialMount &&
    shouldDoInitialRevalidation
  )
  const isValidating = isUndefined(cached.isValidating)
    ? defaultValidatingState
    : cached.isValidating
  const isLoading = isUndefined(cached.isLoading)
    ? defaultValidatingState
    : cached.isLoading

  // The revalidation function is a carefully crafted wrapper of the original
  // `fetcher`, to correctly handle the many edge cases.
  const revalidate = useCallback(
    async (revalidateOpts?: RevalidatorOptions): Promise<boolean> => {
      const currentFetcher = fetcherRef.current

      if (
        !key ||
        !currentFetcher ||
        unmountedRef.current ||
        getConfig().isPaused()
      ) {
        return false
      }

      let newData: Data
      let startAt: number
      let loading = true
      const opts = revalidateOpts || {}

      // If there is no ongoing concurrent request, or `dedupe` is not set, a
      // new request should be initiated.
      const shouldStartNewRequest = !FETCH[key] || !opts.dedupe

      /*
         For React 17
         Do unmount check for calls:
         If key has changed during the revalidation, or the component has been
         unmounted, old dispatch and old event callbacks should not take any
         effect

        For React 18
        only check if key has changed
        https://github.com/reactwg/react-18/discussions/82
      */
      const callbackSafeguard = () => {
        if (IS_REACT_LEGACY) {
          return (
            !unmountedRef.current &&
            key === keyRef.current &&
            initialMountedRef.current
          )
        }
        return key === keyRef.current
      }

      // The final state object when the request finishes.
      const finalState: State<Data, Error> = {
        isValidating: false,
        isLoading: false
      }
      const finishRequestAndUpdateState = () => {
        setCache(finalState)
      }
      const cleanupState = () => {
        // Check if it's still the same request before deleting it.
        const requestInfo = FETCH[key]
        if (requestInfo && requestInfo[1] === startAt) {
          delete FETCH[key]
        }
      }

      // Start fetching. Change the `isValidating` state, update the cache.
      const initialState: State<Data, Error> = { isValidating: true }
      // It is in the `isLoading` state, if and only if there is no cached data.
      // This bypasses fallback data and laggy data.
      if (isUndefined(getCache().data)) {
        initialState.isLoading = true
      }
      try {
        if (shouldStartNewRequest) {
          setCache(initialState)
          // If no cache is being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && isUndefined(getCache().data)) {
            setTimeout(() => {
              if (loading && callbackSafeguard()) {
                getConfig().onLoadingSlow(key, config)
              }
            }, config.loadingTimeout)
          }

          // Start the request and save the timestamp.
          // Key must be truthy if entering here.
          FETCH[key] = [
            currentFetcher(fnArg as DefinitelyTruthy<Key>),
            getTimestamp()
          ]
        }

        // Wait until the ongoing request is done. Deduplication is also
        // considered here.
        ;[newData, startAt] = FETCH[key]
        newData = await newData

        if (shouldStartNewRequest) {
          // If the request isn't interrupted, clean it up after the
          // deduplication interval.
          setTimeout(cleanupState, config.dedupingInterval)
        }

        // If there're other ongoing request(s), started after the current one,
        // we need to ignore the current one to avoid possible race conditions:
        //   req1------------------>res1        (current one)
        //        req2---------------->res2
        // the request that fired later will always be kept.
        // The timestamp maybe be `undefined` or a number
        if (!FETCH[key] || FETCH[key][1] !== startAt) {
          if (shouldStartNewRequest) {
            if (callbackSafeguard()) {
              getConfig().onDiscarded(key)
            }
          }
          return false
        }

        // Clear error.
        finalState.error = UNDEFINED

        // If there're other mutations(s), that overlapped with the current revalidation:
        // case 1:
        //   req------------------>res
        //       mutate------>end
        // case 2:
        //         req------------>res
        //   mutate------>end
        // case 3:
        //   req------------------>res
        //       mutate-------...---------->
        // we have to ignore the revalidation result (res) because it's no longer fresh.
        // meanwhile, a new revalidation should be triggered when the mutation ends.
        const mutationInfo = MUTATION[key]
        if (
          !isUndefined(mutationInfo) &&
          // case 1
          (startAt <= mutationInfo[0] ||
            // case 2
            startAt <= mutationInfo[1] ||
            // case 3
            mutationInfo[1] === 0)
        ) {
          finishRequestAndUpdateState()
          if (shouldStartNewRequest) {
            if (callbackSafeguard()) {
              getConfig().onDiscarded(key)
            }
          }
          return false
        }
        // Deep compare with the latest state to avoid extra re-renders.
        // For local state, compare and assign.
        const cacheData = getCache().data

        // Since the compare fn could be custom fn
        // cacheData might be different from newData even when compare fn returns True
        finalState.data = compare(cacheData, newData) ? cacheData : newData

        // Trigger the successful callback if it's the original request.
        if (shouldStartNewRequest) {
          if (callbackSafeguard()) {
            getConfig().onSuccess(newData, key, config)
          }
        }
      } catch (err) {
        cleanupState()

        const currentConfig = getConfig()
        const { shouldRetryOnError } = currentConfig

        // Not paused, we continue handling the error. Otherwise, discard it.
        if (!currentConfig.isPaused()) {
          // Get a new error, don't use deep comparison for errors.
          finalState.error = err as Error

          // Error event and retry logic. Only for the actual request, not
          // deduped ones.
          if (shouldStartNewRequest && callbackSafeguard()) {
            currentConfig.onError(err, key, currentConfig)
            if (
              shouldRetryOnError === true ||
              (isFunction(shouldRetryOnError) &&
                shouldRetryOnError(err as Error))
            ) {
              if (isActive()) {
                // If it's inactive, stop. It will auto-revalidate when
                // refocusing or reconnecting.
                // When retrying, deduplication is always enabled.
                currentConfig.onErrorRetry(
                  err,
                  key,
                  currentConfig,
                  revalidate,
                  {
                    retryCount: (opts.retryCount || 0) + 1,
                    dedupe: true
                  }
                )
              }
            }
          }
        }
      }

      // Mark loading as stopped.
      loading = false

      // Update the current hook's state.
      finishRequestAndUpdateState()

      return true
    },
    // `setState` is immutable, and `eventsCallback`, `fnArg`, and
    // `keyValidating` are depending on `key`, so we can exclude them from
    // the deps array.
    //
    // FIXME:
    // `fn` and `config` might be changed during the lifecycle,
    // but they might be changed every render like this.
    // `useSWR('key', () => fetch('/api/'), { suspense: true })`
    // So we omit the values from the deps array
    // even though it might cause unexpected behaviors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, cache]
  )

  // Similar to the global mutate but bound to the current cache and key.
  // `cache` isn't allowed to change during the lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundMutate: SWRResponse<Data, Error>['mutate'] = useCallback(
    // Use callback to make sure `keyRef.current` returns latest result every time
    (...args) => {
      return internalMutate(cache, keyRef.current, ...args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // The logic for updating refs.
  useIsomorphicLayoutEffect(() => {
    fetcherRef.current = fetcher
    configRef.current = config
    // Handle laggy data updates. If there's cached data of the current key,
    // it'll be the correct reference.
    if (!isUndefined(cachedData)) {
      laggyDataRef.current = cachedData
    }
  })

  // After mounted or key changed.
  useIsomorphicLayoutEffect(() => {
    if (!key) return

    const softRevalidate = revalidate.bind(UNDEFINED, WITH_DEDUPE)

    // Expose revalidators to global event listeners. So we can trigger
    // revalidation from the outside.
    let nextFocusRevalidatedAt = 0
    const onRevalidate = (type: RevalidateEvent) => {
      if (type == revalidateEvents.FOCUS_EVENT) {
        const now = Date.now()
        if (
          getConfig().revalidateOnFocus &&
          now > nextFocusRevalidatedAt &&
          isActive()
        ) {
          nextFocusRevalidatedAt = now + getConfig().focusThrottleInterval
          softRevalidate()
        }
      } else if (type == revalidateEvents.RECONNECT_EVENT) {
        if (getConfig().revalidateOnReconnect && isActive()) {
          softRevalidate()
        }
      } else if (type == revalidateEvents.MUTATE_EVENT) {
        return revalidate()
      }
      return
    }

    const unsubEvents = subscribeCallback(key, EVENT_REVALIDATORS, onRevalidate)

    // Mark the component as mounted and update corresponding refs.
    unmountedRef.current = false
    keyRef.current = key
    initialMountedRef.current = true

    // Keep the original key in the cache.
    setCache({ _k: fnArg })

    // Trigger a revalidation.
    if (shouldDoInitialRevalidation) {
      if (isUndefined(data) || IS_SERVER) {
        // Revalidate immediately.
        softRevalidate()
      } else {
        // Delay the revalidate if we have data to return so we won't block
        // rendering.
        rAF(softRevalidate)
      }
    }

    return () => {
      // Mark it as unmounted.
      unmountedRef.current = true

      unsubEvents()
    }
  }, [key])

  // Polling
  useIsomorphicLayoutEffect(() => {
    let timer: any

    function next() {
      // Use the passed interval
      // ...or invoke the function with the updated data to get the interval
      const interval = isFunction(refreshInterval)
        ? refreshInterval(data)
        : refreshInterval

      // We only start the next interval if `refreshInterval` is not 0, and:
      // - `force` is true, which is the start of polling
      // - or `timer` is not 0, which means the effect wasn't canceled
      if (interval && timer !== -1) {
        timer = setTimeout(execute, interval)
      }
    }

    function execute() {
      // Check if it's OK to execute:
      // Only revalidate when the page is visible, online, and not errored.
      if (
        !getCache().error &&
        (refreshWhenHidden || getConfig().isVisible()) &&
        (refreshWhenOffline || getConfig().isOnline())
      ) {
        revalidate(WITH_DEDUPE).then(next)
      } else {
        // Schedule the next interval to check again.
        next()
      }
    }

    next()

    return () => {
      if (timer) {
        clearTimeout(timer)
        timer = -1
      }
    }
  }, [refreshInterval, refreshWhenHidden, refreshWhenOffline, key])

  // Display debug info in React DevTools.
  useDebugValue(returnedData)

  // In Suspense mode, we can't return the empty `data` state.
  // If there is an `error`, the `error` needs to be thrown to the error boundary.
  // If there is no `error`, the `revalidation` promise needs to be thrown to
  // the suspense boundary.
  if (suspense && isUndefined(data) && key) {
    // SWR should throw when trying to use Suspense on the server with React 18,
    // without providing any initial data. See:
    // https://github.com/vercel/swr/issues/1832
    if (!IS_REACT_LEGACY && IS_SERVER) {
      throw new Error('Fallback data is required when using suspense in SSR.')
    }

    // Always update fetcher and config refs even with the Suspense mode.
    fetcherRef.current = fetcher
    configRef.current = config
    unmountedRef.current = false
    throw isUndefined(error) ? revalidate(WITH_DEDUPE) : error
  }

  return {
    mutate: boundMutate,
    get data() {
      stateDependencies.data = true
      return returnedData
    },
    get error() {
      stateDependencies.error = true
      return error
    },
    get isValidating() {
      stateDependencies.isValidating = true
      return isValidating
    },
    get isLoading() {
      stateDependencies.isLoading = true
      return isLoading
    }
  } as SWRResponse<Data, Error>
}

export const SWRConfig = OBJECT.defineProperty(ConfigProvider, 'defaultValue', {
  value: defaultConfig
}) as typeof ConfigProvider & {
  defaultValue: FullConfiguration
}

export const unstable_serialize = (key: Key) => serialize(key)[0]

/**
 * A hook to fetch data.
 *
 * @link https://swr.vercel.app
 * @example
 * ```jsx
 * import useSWR from 'swr'
 * function Profile() {
 *   const { data, error } = useSWR('/api/user', fetcher)
 *   if (error) return <div>failed to load</div>
 *   if (!data) return <div>loading...</div>
 *   return <div>hello {data.name}!</div>
 * }
 * ```
 */
export default withArgs<SWRHook>(useSWRHandler)
