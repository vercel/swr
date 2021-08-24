import { useCallback, useRef, useDebugValue } from 'react'
import { defaultConfig } from './utils/config'
import { SWRGlobalState, GlobalState } from './utils/global-state'
import { IS_SERVER, rAF, useIsomorphicLayoutEffect } from './utils/env'
import { serialize } from './utils/serialize'
import { isUndefined, UNDEFINED, mergeObjects } from './utils/helper'
import ConfigProvider from './utils/config-context'
import useStateWithDeps from './utils/state'
import withArgs from './utils/resolve-args'
import { subscribeCallback } from './utils/subscribe-key'
import { broadcastState } from './utils/broadcast-state'
import { getTimestamp } from './utils/timestamp'
import { internalMutate } from './utils/mutate'

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
  fn: Fetcher<Data> | null,
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

  const [
    EVENT_REVALIDATORS,
    STATE_UPDATERS,
    MUTATION_TS,
    MUTATION_END_TS,
    CONCURRENT_PROMISES,
    CONCURRENT_PROMISES_TS
  ] = SWRGlobalState.get(cache) as GlobalState

  // `key` is the identifier of the SWR `data` state, `keyErr` and
  // `keyValidating` are identifiers of `error` and `isValidating`,
  // all of them are derived from `_key`.
  // `fnArgs` is an array of arguments parsed from the key, which will be passed
  // to the fetcher.
  const [key, fnArgs, keyErr, keyValidating] = serialize(_key)

  // If it's the initial render of this hook.
  const initialMountedRef = useRef(false)

  // If the hook is unmounted already. This will be used to prevent some effects
  // to be called after unmounting.
  const unmountedRef = useRef(false)

  // Refs to keep the key and config.
  const keyRef = useRef(key)
  const configRef = useRef(config)

  // Get the current state that SWR should return.
  const cached = cache.get(key)
  const fallback = isUndefined(fallbackData)
    ? config.fallback[key]
    : fallbackData
  const data = isUndefined(cached) ? fallback : cached
  const error = cache.get(keyErr)

  // A revalidation must be triggered when mounted if:
  // - `revalidateOnMount` is explicitly set to `true`.
  // - Suspense mode and there's stale data for the initial render.
  // - Not suspense mode and there is no fallback data and `revalidateWhenStale` is enabled.
  // - `revalidateWhenStale` is enabled but `data` is not defined.
  const shouldRevalidateOnMount = () => {
    if (!isUndefined(revalidateOnMount)) return revalidateOnMount

    return suspense
      ? !initialMountedRef.current && !isUndefined(data)
      : isUndefined(data) || config.revalidateWhenStale
  }

  // Resolve the current validating state.
  const resolveValidating = () => {
    if (!key || !fn) return false
    if (cache.get(keyValidating)) return true

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
      if (!key || !fn || unmountedRef.current || configRef.current.isPaused()) {
        return false
      }

      let newData: Data
      let startAt: number
      let loading = true
      const opts = revalidateOpts || {}
      const shouldDedupe = !isUndefined(CONCURRENT_PROMISES[key]) && opts.dedupe

      // Do unmount check for callbacks:
      // If key has changed during the revalidation, or the component has been
      // unmounted, old dispatch and old event callbacks should not take any
      // effect.
      const isCallbackSafe = () =>
        !unmountedRef.current &&
        key === keyRef.current &&
        initialMountedRef.current

      const cleanupState = () => {
        delete CONCURRENT_PROMISES[key]
        delete CONCURRENT_PROMISES_TS[key]
      }

      // start fetching
      try {
        cache.set(keyValidating, true)
        setState({
          isValidating: true
        })
        if (!shouldDedupe) {
          // also update other hooks
          broadcastState(
            cache,
            key,
            stateRef.current.data,
            stateRef.current.error,
            true
          )
        }

        if (shouldDedupe) {
          // There's already an ongoing request, this one needs to be
          // deduplicated.
          startAt = CONCURRENT_PROMISES_TS[key]
          newData = await CONCURRENT_PROMISES[key]
        } else {
          // If no cache being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && !cache.get(key)) {
            setTimeout(() => {
              if (loading && isCallbackSafe())
                configRef.current.onLoadingSlow(key, config)
            }, config.loadingTimeout)
          }

          // Start the request and keep the timestamp.
          CONCURRENT_PROMISES_TS[key] = startAt = getTimestamp()
          newData = await (CONCURRENT_PROMISES[key] = fn.apply(fn, fnArgs))

          setTimeout(() => {
            // CONCURRENT_PROMISES_TS[key] maybe be `undefined` or a number.
            if (CONCURRENT_PROMISES_TS[key] === startAt) {
              cleanupState()
            }
          }, config.dedupingInterval)

          // trigger the success event,
          // only do this for the original request.
          if (isCallbackSafe()) {
            configRef.current.onSuccess(newData, key, config)
          }
        }

        // if there're other ongoing request(s), started after the current one,
        // we need to ignore the current one to avoid possible race conditions:
        //   req1------------------>res1        (current one)
        //        req2---------------->res2
        // the request that fired later will always be kept.
        // CONCURRENT_PROMISES_TS[key] maybe be `undefined` or a number
        if (CONCURRENT_PROMISES_TS[key] !== startAt) {
          return false
        }

        // if there're other mutations(s), overlapped with the current revalidation:
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
        if (
          !isUndefined(MUTATION_TS[key]) &&
          // case 1
          (startAt <= MUTATION_TS[key] ||
            // case 2
            startAt <= MUTATION_END_TS[key] ||
            // case 3
            MUTATION_END_TS[key] === 0)
        ) {
          setState({ isValidating: false })
          return false
        }

        cache.set(keyErr, UNDEFINED)
        cache.set(keyValidating, false)

        const newState: State<Data, Error> = {
          isValidating: false
        }

        if (!isUndefined(stateRef.current.error)) {
          newState.error = UNDEFINED
        }

        // Deep compare with latest state to avoid extra re-renders.
        // For local state, compare and assign.
        if (!compare(stateRef.current.data, newData)) {
          newState.data = newData
        }
        // For global state, it's possible that the key has changed.
        // https://github.com/vercel/swr/pull/1058
        if (!compare(cache.get(key), newData)) {
          cache.set(key, newData)
        }

        // merge the new state
        setState(newState)

        if (!shouldDedupe) {
          // also update other hooks
          broadcastState(cache, key, newData, newState.error, false)
        }
      } catch (err) {
        cleanupState()
        if (configRef.current.isPaused()) {
          setState({
            isValidating: false
          })
          return false
        }

        // Get a new error, don't use deep comparison for errors.
        cache.set(keyErr, err)
        if (stateRef.current.error !== err) {
          // Keep the stale data but update error.
          setState({
            isValidating: false,
            error: err
          })
          if (!shouldDedupe) {
            // Broadcast to update the states of other hooks.
            broadcastState(cache, key, UNDEFINED, err, false)
          }
        }

        // Error event and retry logic.
        if (isCallbackSafe()) {
          configRef.current.onError(err, key, config)
          if (config.shouldRetryOnError) {
            // When retrying, dedupe is always enabled
            configRef.current.onErrorRetry(err, key, config, revalidate, {
              retryCount: (opts.retryCount || 0) + 1,
              dedupe: true
            })
          }
        }
      }

      loading = false
      return true
    },
    // `setState` is immutable, and `eventsCallback`, `fnArgs`, `keyErr`,
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
    internalMutate.bind(UNDEFINED, cache, keyRef.current),
    []
  )

  // Always update config.
  useIsomorphicLayoutEffect(() => {
    configRef.current = config
  })

  // After mounted or key changed.
  useIsomorphicLayoutEffect(() => {
    if (!key) return

    // Not the initial render.
    const keyChanged = initialMountedRef.current
    const softRevalidate = revalidate.bind(UNDEFINED, WITH_DEDUPE)

    const isActive = () =>
      configRef.current.isVisible() && configRef.current.isOnline()

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
          // if data is undefined we should not update stateRef.current.data
          !compare(updatedData, stateRef.current.data)
            ? {
                data: updatedData
              }
            : null
        )
      )
    }

    // Expose revalidators to global event listeners. So we can trigger
    // revalidation from the outside.
    let nextFocusRevalidatedAt = 0
    const onRevalidate = (type: RevalidateEvent) => {
      if (type === RevalidateEvent.FOCUS_EVENT) {
        const now = Date.now()
        if (
          configRef.current.revalidateOnFocus &&
          now > nextFocusRevalidatedAt &&
          isActive()
        ) {
          nextFocusRevalidatedAt = now + configRef.current.focusThrottleInterval
          softRevalidate()
        }
      } else if (type === RevalidateEvent.RECONNECT_EVENT) {
        if (configRef.current.revalidateOnReconnect && isActive()) {
          softRevalidate()
        }
      } else if (type === RevalidateEvent.MUTATE_EVENT) {
        return revalidate()
      }
      return
    }

    const unsubUpdate = subscribeCallback(key, STATE_UPDATERS, onStateUpdate)
    const unsubEvents = subscribeCallback(key, EVENT_REVALIDATORS, onRevalidate)

    // Mark the component as mounted and update corresponding refs.
    unmountedRef.current = false
    keyRef.current = key

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
    if (keyChanged || shouldRevalidateOnMount()) {
      if (isUndefined(data) || IS_SERVER) {
        // Revalidate immediately.
        softRevalidate()
      } else {
        // Delay the revalidate if we have data to return so we won't block
        // rendering.
        rAF(softRevalidate)
      }
    }

    // Finally, the component is mounted.
    initialMountedRef.current = true

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
      // We only start next interval if `refreshInterval` is not 0, and:
      // - `force` is true, which is the start of polling
      // - or `timer` is not 0, which means the effect wasn't canceled
      if (refreshInterval && timer !== -1) {
        timer = setTimeout(execute, refreshInterval)
      }
    }

    function execute() {
      // Check if it's OK to execute:
      // Only revalidate when the page is visible, online and not errored.
      if (
        !stateRef.current.error &&
        (refreshWhenHidden || config.isVisible()) &&
        (refreshWhenOffline || config.isOnline())
      ) {
        revalidate(WITH_DEDUPE).then(() => next())
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
  if (suspense && isUndefined(data)) {
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

export const SWRConfig = Object.defineProperty(ConfigProvider, 'default', {
  value: defaultConfig
}) as typeof ConfigProvider & {
  default: FullConfiguration
}

export const unstable_serialize = (key: Key) => serialize(key)[0]

export default withArgs<SWRHook>(useSWRHandler)
