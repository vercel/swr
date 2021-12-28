import { useCallback, useRef, useDebugValue } from 'react'
import { defaultConfig } from './utils/config'
import { SWRGlobalState, GlobalState } from './utils/global-state'
import { IS_SERVER, rAF, useIsomorphicLayoutEffect } from './utils/env'
import { serialize } from './utils/serialize'
import {
  isUndefined,
  UNDEFINED,
  OBJECT,
  mergeObjects,
  isFunction
} from './utils/helper'
import ConfigProvider from './utils/config-context'
import { useStateWithDeps } from './utils/state'
import { withArgs } from './utils/resolve-args'
import { subscribeCallback } from './utils/subscribe-key'
import { broadcastState } from './utils/broadcast-state'
import { getTimestamp } from './utils/timestamp'
import { internalMutate } from './utils/mutate'
import * as revalidateEvents from './constants/revalidate-events'
import {
  State,
  Fetcher,
  Key,
  SWRResponse,
  RevalidatorOptions,
  FullConfiguration,
  SWRConfiguration,
  SWRHook,
  StateUpdateCallback,
  RevalidateEvent
} from './types'

const WITH_DEDUPE = { dedupe: true }

export const useSWRHandler = <Data = any, Error = any>(
  _key: Key,
  fetcher: Fetcher<Data> | null,
  config: typeof defaultConfig & SWRConfiguration<Data, Error>
) => {
  const {
    cache,
    compare,
    fallbackData,
    suspense,
    revalidateOnMount,
    refreshInterval,
    refreshWhenHidden,
    refreshWhenOffline
  } = config

  const [EVENT_REVALIDATORS, STATE_UPDATERS, MUTATION, FETCH] =
    SWRGlobalState.get(cache) as GlobalState

  // `key` is the identifier of the SWR `data` state, `keyInfo` holds extra
  // states such as `error` and `isValidating` inside,
  // all of them are derived from `_key`.
  // `fnArgs` is an array of arguments parsed from the key, which will be passed
  // to the fetcher.
  const [key, fnArgs, keyInfo] = serialize(_key)

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
  const patchFetchInfo = (info: { isValidating?: boolean; error?: any }) =>
    cache.set(keyInfo, mergeObjects(cache.get(keyInfo), info))

  // Get the current state that SWR should return.
  const cached = cache.get(key)
  const fallback = isUndefined(fallbackData)
    ? config.fallback[key]
    : fallbackData
  const data = isUndefined(cached) ? fallback : cached
  const info = cache.get(keyInfo) || {}
  const error = info.error

  // - Suspense mode and there's stale data for the initial render.
  // - Not suspense mode and there is no fallback data and `revalidateIfStale` is enabled.
  // - `revalidateIfStale` is enabled but `data` is not defined.
  const shouldRevalidateOnMount = () => {
    // If `revalidateOnMount` is set, we take the value directly.
    if (!isUndefined(revalidateOnMount)) return revalidateOnMount

    // If it's paused, we skip revalidation.
    if (getConfig().isPaused()) return false

    return suspense
      ? // Under suspense mode, it will always fetch on render if there is no
        // stale data so no need to revalidate immediately on mount again.
        !isUndefined(data)
      : // If there is no stale data, we need to revalidate on mount;
        // If `revalidateIfStale` is set to true, we will always revalidate.
        isUndefined(data) || config.revalidateIfStale
  }

  // Resolve the current validating state.
  const resolveValidating = () => {
    if (!key || !fetcher) return false
    if (info.isValidating) return true

    // If it's not mounted yet and it should revalidate on mount, revalidate.
    return !initialMountedRef.current && shouldRevalidateOnMount()
  }
  const isValidating = resolveValidating()

  const [stateRef, stateDependencies, setState] = useStateWithDeps<Data, Error>(
    {
      data,
      error,
      isValidating
    },
    unmountedRef
  )

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

      // Do unmount check for calls:
      // If key has changed during the revalidation, or the component has been
      // unmounted, old dispatch and old event callbacks should not take any
      // effect.
      const isCurrentKeyMounted = () =>
        !unmountedRef.current &&
        key === keyRef.current &&
        initialMountedRef.current

      const cleanupState = () => {
        // Check if it's still the same request before deleting.
        const requestInfo = FETCH[key]
        if (requestInfo && requestInfo[1] === startAt) {
          delete FETCH[key]
        }
      }

      // The new state object when request finishes.
      const newState: State<Data, Error> = { isValidating: false }
      const finishRequestAndUpdateState = () => {
        patchFetchInfo({ isValidating: false })
        // We can only set state if it's safe (still mounted with the same key).
        if (isCurrentKeyMounted()) {
          setState(newState)
        }
      }

      // Start fetching. Change the `isValidating` state, update the cache.
      patchFetchInfo({
        isValidating: true
      })
      setState({ isValidating: true })

      try {
        if (shouldStartNewRequest) {
          // Tell all other hooks to change the `isValidating` state.
          broadcastState(
            cache,
            key,
            stateRef.current.data,
            stateRef.current.error,
            true
          )

          // If no cache being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && !cache.get(key)) {
            setTimeout(() => {
              if (loading && isCurrentKeyMounted()) {
                getConfig().onLoadingSlow(key, config)
              }
            }, config.loadingTimeout)
          }

          // Start the request and save the timestamp.
          FETCH[key] = [currentFetcher(...fnArgs), getTimestamp()]
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
            if (isCurrentKeyMounted()) {
              getConfig().onDiscarded(key)
            }
          }
          return false
        }

        // Clear error.
        patchFetchInfo({
          error: UNDEFINED
        })
        newState.error = UNDEFINED

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
            if (isCurrentKeyMounted()) {
              getConfig().onDiscarded(key)
            }
          }
          return false
        }

        // Deep compare with latest state to avoid extra re-renders.
        // For local state, compare and assign.
        if (!compare(stateRef.current.data, newData)) {
          newState.data = newData
        } else {
          // data and newData are deeply equal
          // it should be safe to broadcast the stale data
          newState.data = stateRef.current.data
          // At the end of this function, `brocastState` invokes the `onStateUpdate` function,
          // which takes care of avoiding the re-render
        }

        // For global state, it's possible that the key has changed.
        // https://github.com/vercel/swr/pull/1058
        if (!compare(cache.get(key), newData)) {
          cache.set(key, newData)
        }

        // Trigger the successful callback if it's the original request.
        if (shouldStartNewRequest) {
          if (isCurrentKeyMounted()) {
            getConfig().onSuccess(newData, key, config)
          }
        }
      } catch (err) {
        cleanupState()

        // Not paused, we continue handling the error. Otherwise discard it.
        if (!getConfig().isPaused()) {
          // Get a new error, don't use deep comparison for errors.
          patchFetchInfo({ error: err })
          newState.error = err as Error

          // Error event and retry logic. Only for the actual request, not
          // deduped ones.
          if (shouldStartNewRequest && isCurrentKeyMounted()) {
            getConfig().onError(err, key, config)
            if (config.shouldRetryOnError) {
              // When retrying, dedupe is always enabled
              if (isActive()) {
                // If it's active, stop. It will auto revalidate when refocusing
                // or reconnecting.
                getConfig().onErrorRetry(err, key, config, revalidate, {
                  retryCount: (opts.retryCount || 0) + 1,
                  dedupe: true
                })
              }
            }
          }
        }
      }

      // Mark loading as stopped.
      loading = false

      // Update the current hook's state.
      finishRequestAndUpdateState()

      // Here is the source of the request, need to tell all other hooks to
      // update their states.
      if (isCurrentKeyMounted() && shouldStartNewRequest) {
        broadcastState(cache, key, newState.data, newState.error, false)
      }

      return true
    },
    // `setState` is immutable, and `eventsCallback`, `fnArgs`, `keyInfo`,
    // and `keyValidating` are depending on `key`, so we can exclude them from
    // the deps array.
    //
    // FIXME:
    // `fn` and `config` might be changed during the lifecycle,
    // but they might be changed every render like this.
    // `useSWR('key', () => fetch('/api/'), { suspense: true })`
    // So we omit the values from the deps array
    // even though it might cause unexpected behaviors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  )

  // Similar to the global mutate, but bound to the current cache and key.
  // `cache` isn't allowed to change during the lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const boundMutate: SWRResponse<Data, Error>['mutate'] = useCallback(
    // By using `bind` we don't need to modify the size of the rest arguments.
    internalMutate.bind(UNDEFINED, cache, () => keyRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Always update fetcher and config refs.
  useIsomorphicLayoutEffect(() => {
    fetcherRef.current = fetcher
    configRef.current = config
  })

  // After mounted or key changed.
  useIsomorphicLayoutEffect(() => {
    if (!key) return

    // Not the initial render.
    const keyChanged = initialMountedRef.current
    const softRevalidate = revalidate.bind(UNDEFINED, WITH_DEDUPE)

    // Expose state updater to global event listeners. So we can update hook's
    // internal state from the outside.
    const onStateUpdate: StateUpdateCallback<Data, Error> = (
      updatedData,
      updatedError,
      updatedIsValidating
    ) => {
      setState(
        mergeObjects(
          {
            error: updatedError,
            isValidating: updatedIsValidating
          },
          // Since `setState` only shallowly compares states, we do a deep
          // comparison here.
          compare(stateRef.current.data, updatedData)
            ? UNDEFINED
            : {
                data: updatedData
              }
        )
      )
    }

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

    const unsubUpdate = subscribeCallback(key, STATE_UPDATERS, onStateUpdate)
    const unsubEvents = subscribeCallback(key, EVENT_REVALIDATORS, onRevalidate)

    // Mark the component as mounted and update corresponding refs.
    unmountedRef.current = false
    keyRef.current = key
    initialMountedRef.current = true

    // When `key` updates, reset the state to the initial value
    // and trigger a rerender if necessary.
    if (keyChanged) {
      setState({
        data,
        error,
        isValidating
      })
    }

    // Trigger a revalidation.
    if (shouldRevalidateOnMount()) {
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

      unsubUpdate()
      unsubEvents()
    }
  }, [key, revalidate])

  // Polling
  useIsomorphicLayoutEffect(() => {
    let timer: any

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
        !stateRef.current.error &&
        (refreshWhenHidden || getConfig().isVisible()) &&
        (refreshWhenOffline || getConfig().isOnline())
      ) {
        revalidate(WITH_DEDUPE).then(next)
      } else {
        // Schedule next interval to check again.
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
  }, [refreshInterval, refreshWhenHidden, refreshWhenOffline, revalidate])

  // Display debug info in React DevTools.
  useDebugValue(data)

  // In Suspense mode, we can't return the empty `data` state.
  // If there is `error`, the `error` needs to be thrown to the error boundary.
  // If there is no `error`, the `revalidation` promise needs to be thrown to
  // the suspense boundary.
  if (suspense && isUndefined(data) && key) {
    throw isUndefined(error) ? revalidate(WITH_DEDUPE) : error
  }

  return {
    mutate: boundMutate,
    get data() {
      stateDependencies.data = true
      return data
    },
    get error() {
      stateDependencies.error = true
      return error
    },
    get isValidating() {
      stateDependencies.isValidating = true
      return isValidating
    }
  } as SWRResponse<Data, Error>
}

export const SWRConfig = OBJECT.defineProperty(ConfigProvider, 'default', {
  value: defaultConfig
}) as typeof ConfigProvider & {
  default: FullConfiguration
}

export const unstable_serialize = (key: Key) => serialize(key)[0]

export default withArgs<SWRHook>(useSWRHandler)
