// We have to several type castings here because `useSWRList` is a special
// hook where `key` and return type are not like the normal `useSWR` types.

import { useCallback, useDebugValue, useMemo, useRef } from 'react'
import { SWRConfig, Key } from 'swr'

import {
  BareFetcher,
  createCacheHelper,
  serialize,
  internalMutate,
  UNDEFINED,
  SWRResponse,
  SWRGlobalState,
  GlobalState,
  StateDependencies,
  isUndefined,
  State,
  isEmptyCache,
  stableHash,
  RevalidatorOptions,
  IS_REACT_LEGACY,
  getTimestamp,
  DefinitelyTruthy,
  isFunction,
  useIsomorphicLayoutEffect,
  WITH_DEDUPE,
  RevalidateEvent,
  revalidateEvents,
  subscribeCallback,
  IS_SERVER,
  rAF,
  withArgs
} from 'swr/_internal'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import { SWRListConfiguration, SWRListHook, SWRListResponse } from './types'

export const useSWRListHandler = <Data, Error>(
  keys: Key[],
  fetcher: BareFetcher<Data> | null,
  config: typeof SWRConfig.defaultValue & SWRListConfiguration<Data, Error>
): SWRListResponse<Data, Error> => {
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

  // If it's the initial render of this hook.
  const initialMountedRef = useRef(false)
  const isInitialMount = !initialMountedRef.current

  // If the hook is unmounted already. This will be used to prevent some effects
  // to be called after unmounting.
  const unmountedRef = useRef(false)

  // Refs to keep the key and config.
  const keysRef = useRef<Key[]>([])
  const fetcherRef = useRef(fetcher)
  const configRef = useRef(config)
  const stateDependenciesRef = useRef<StateDependencies[]>([])
  // Use a ref to store previous returned data. Use the inital data as its inital value.
  const laggyDataRef = useRef<Data[]>([])
  const getConfig = () => configRef.current
  const isActive = () => getConfig().isVisible() && getConfig().isOnline()

  const serializedKeys = keys.map(_key => serialize(_key))
  const keysHash = stableHash(serializedKeys)
  const cacheHelpers = serializedKeys.map(([key]) =>
    createCacheHelper<Data>(cache, key)
  )
  const getCachedDataForIndex = useCallback(
    (index: number) => cacheHelpers[index][0]().data,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysHash]
  )
  const getDataForIndex = useCallback(
    (index: number) => {
      const cachedData = getCachedDataForIndex(index)
      const data = isUndefined(cachedData) ? fallback : cachedData
      return data
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysHash]
  )
  const fallback = isUndefined(fallbackData)
    ? config.fallback['TODO']
    : fallbackData

  const getSnapshot = useCallback(
    () => cacheHelpers.map(([getCache]) => getCache()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cache, keysHash]
  )

  const selector = (snapshots: State<Data, any>[]) => {
    return snapshots.map((snapshot, index) => {
      const key = serializedKeys[index][0]
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
      if (!shouldStartRequest) return snapshot
      if (isEmptyCache(snapshot)) {
        return {
          isValidating: true,
          isLoading: true
        }
      }
      return snapshot
    })
  }

  const isEqual = useCallback(
    (prevs: State<Data, any>[], currents: State<Data, any>[]) => {
      if (prevs.length !== currents.length) {
        return false
      }
      return currents.every((current, i) => {
        const prev = prevs[i]
        const stateDependencies = stateDependenciesRef.current[i]
        let equal = true
        for (const _ in stateDependencies) {
          const t = _ as keyof StateDependencies
          if (!compare(current[t], prev[t])) {
            if (t === 'data' && isUndefined(prev[t])) {
              if (!compare(current[t], fallback)) {
                equal = false
              }
            } else {
              equal = false
            }
          }
        }
        return equal
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cache, keysHash]
  )

  // Get the current state that SWR should return.
  const caches = useSyncExternalStoreWithSelector(
    useCallback(
      (callback: () => void) => {
        const unsubs = cacheHelpers.map(([, , subscribeCache], index) =>
          subscribeCache(serializedKeys[index][0], () => {
            callback()
          })
        )
        return () => unsubs.forEach(unsub => unsub())
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [cache, keysHash]
    ),
    getSnapshot,
    getSnapshot,
    selector,
    isEqual
  )

  const boundMutates = useMemo(
    // By using `bind` we don't need to modify the size of the rest arguments.
    // Due to https://github.com/microsoft/TypeScript/issues/37181, we have to
    // cast it to any for now.
    () =>
      serializedKeys.map(
        (_, index) =>
          internalMutate.bind(
            UNDEFINED,
            cache,
            () => keysRef.current[index]
          ) as any
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serializedKeys.length]
  )

  // - Suspense mode and there's stale data for the initial render.
  // - Not suspense mode and there is no fallback data and `revalidateIfStale` is enabled.
  // - `revalidateIfStale` is enabled but `data` is not defined.
  const shouldDoInitialRevalidation = (index: number) => {
    // If `revalidateOnMount` is set, we take the value directly.
    if (isInitialMount && !isUndefined(revalidateOnMount))
      return revalidateOnMount

    // If it's paused, we skip revalidation.
    if (getConfig().isPaused()) return false

    const data = getDataForIndex(index)

    // If there is no stale data, we need to revalidate on mount;
    // If `revalidateIfStale` is set to true, we will always revalidate.
    return isUndefined(data) || config.revalidateIfStale
  }

  // The revalidation function is a carefully crafted wrapper of the original
  // `fetcher`, to correctly handle the many edge cases.
  const revalidate = useCallback(
    async (
      [key, fnArg]: [string, Key],
      index: number,
      getCache: () => State<Data, any>,
      setCache: (info: State<Data, any>) => void,
      revalidateOpts?: RevalidatorOptions
    ): Promise<boolean> => {
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
            key === keysRef.current[index] &&
            initialMountedRef.current
          )
        }
        return key === keysRef.current[index]
      }

      // The final state object when request finishes.
      const finalState: State<Data, Error> = {
        isValidating: false,
        isLoading: false
      }
      const finishRequestAndUpdateState = () => {
        setCache(finalState)
      }
      const cleanupState = () => {
        // Check if it's still the same request before deleting.
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
          // If no cache being rendered currently (it shows a blank page),
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

        // If there're other mutations(s), overlapped with the current revalidation:
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
        // Deep compare with latest state to avoid extra re-renders.
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

        // Not paused, we continue handling the error. Otherwise discard it.
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
                // If it's inactive, stop. It will auto revalidate when
                // refocusing or reconnecting.
                // When retrying, deduplication is always enabled.
                currentConfig.onErrorRetry(
                  err,
                  key,
                  currentConfig,
                  revOpts =>
                    revalidate(
                      [key, fnArg],
                      index,
                      getCache,
                      setCache,
                      revOpts
                    ),
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
    [keysHash, cache]
  )

  // Logic for updating refs.
  useIsomorphicLayoutEffect(() => {
    fetcherRef.current = fetcher
    configRef.current = config
    keys.forEach((_, index) => {
      const cachedData = getCachedDataForIndex(index)
      // Handle laggy data updates. If there's cached data of the current key,
      // it'll be the correct reference.
      if (!isUndefined(cachedData)) {
        laggyDataRef.current[index] = cachedData
      }
    })
  })

  // After mounted or key changed.
  useIsomorphicLayoutEffect(() => {
    const unsubEvents: (() => void)[] = []
    serializedKeys.forEach(([key, fnArg], index) => {
      if (!key) return

      const [getCache, setCache] = cacheHelpers[index]
      const data = getDataForIndex(index)
      // `bind` isn't playing nice with TS
      // TODO Fix
      const softRevalidate = (revalidate as any).bind(
        UNDEFINED,
        [key, fnArg],
        index,
        getCache,
        setCache,
        WITH_DEDUPE
      )

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
          return revalidate([key, fnArg], index, getCache, setCache)
        }
        return
      }

      unsubEvents.push(subscribeCallback(key, EVENT_REVALIDATORS, onRevalidate))

      // Mark the component as mounted and update corresponding refs.
      unmountedRef.current = false
      keysRef.current[index] = key
      initialMountedRef.current = true

      // Trigger a revalidation.
      if (shouldDoInitialRevalidation(index)) {
        if (isUndefined(data) || IS_SERVER) {
          // Revalidate immediately.
          softRevalidate()
        } else {
          // Delay the revalidate if we have data to return so we won't block
          // rendering.
          rAF(softRevalidate)
        }
      }
    })

    return () => {
      // Mark it as unmounted.
      unmountedRef.current = true

      unsubEvents.forEach(unsub => unsub())
    }
  }, [keysHash])

  // Polling
  useIsomorphicLayoutEffect(() => {
    const timers: any[] = []

    serializedKeys.forEach((_, index) => {
      let timer: any
      const [getCache, setCache] = cacheHelpers[index]
      const data = getDataForIndex(index)

      function next() {
        // Use the passed interval
        // ...or invoke the function with the updated data to get the interval
        const interval = isFunction(refreshInterval)
          ? refreshInterval(data)
          : refreshInterval

        // We only start next interval if `refreshInterval` is not 0, and:
        // - `force` is true, which is the start of polling
        // - or `timer` is not 0, which means the effect wasn't canceled
        if (interval && timer !== -1) {
          timer = setTimeout(execute, interval)
        }
      }

      function execute() {
        // Check if it's OK to execute:
        // Only revalidate when the page is visible, online and not errored.
        if (
          !getCache().error &&
          (refreshWhenHidden || getConfig().isVisible()) &&
          (refreshWhenOffline || getConfig().isOnline())
        ) {
          revalidate(_, index, getCache, setCache, WITH_DEDUPE).then(next)
        } else {
          // Schedule next interval to check again.
          next()
        }
      }

      next()
    })

    return () => {
      if (timers.length) {
        timers.forEach(timer => {
          clearTimeout(timer)
        })
        timers.length = 0
      }
    }
  }, [refreshInterval, refreshWhenHidden, refreshWhenOffline, keysHash])

  const results = serializedKeys.map(([key], index) => {
    if (!(index in keysRef.current)) keysRef.current[index] = key

    if (!(index in stateDependenciesRef.current))
      stateDependenciesRef.current[index] = {}
    const stateDependencies = stateDependenciesRef.current[index]

    const cached = caches[index]
    const cachedData = cached.data
    const data = getDataForIndex(index)
    const error = cached.error

    if (!(index in laggyDataRef.current)) keysRef.current[index] = data

    const returnedData = keepPreviousData
      ? isUndefined(cachedData)
        ? laggyDataRef.current[index]
        : cachedData
      : data

    // Resolve the default validating state:
    // If it's able to validate, and it should revalidate on mount, this will be true.
    const defaultValidatingState = !!(
      key &&
      fetcher &&
      isInitialMount &&
      shouldDoInitialRevalidation(index)
    )
    const isValidating = cached.isValidating || defaultValidatingState
    const isLoading = cached.isLoading || defaultValidatingState

    const boundMutate: SWRResponse<Data, Error>['mutate'] = boundMutates[index]

    if (suspense) {
      throw new Error('Suspense is disabled for useSWRList')
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
  })

  // Display debug info in React DevTools.
  useDebugValue(results.map(({ data }) => data))

  return results
}

export default withArgs(useSWRListHandler) as SWRListHook
export { SWRListConfiguration, SWRListResponse }
