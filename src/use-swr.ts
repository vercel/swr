// TODO: use @ts-expect-error
import { useCallback, useContext, useState, useRef, useDebugValue } from 'react'

import defaultConfig, { cache } from './config'
import { IS_SERVER, rAF, useIsomorphicLayoutEffect } from './env'
import SWRConfigContext from './swr-config-context'
import {
  Action,
  Broadcaster,
  Fetcher,
  Key,
  Mutator,
  SWRResponse,
  RevalidatorOptions,
  Trigger,
  Updater,
  SWRConfiguration
} from './types'

type Revalidator = (...args: any[]) => void

// Global states
const CONCURRENT_PROMISES: Record<string, any> = {}
const CONCURRENT_PROMISES_TS: Record<string, number> = {}
const FOCUS_REVALIDATORS: Record<string, Revalidator[]> = {}
const RECONNECT_REVALIDATORS: Record<string, Revalidator[]> = {}
const CACHE_REVALIDATORS: Record<string, Updater[]> = {}
const MUTATION_TS: Record<string, number> = {}
const MUTATION_END_TS: Record<string, number> = {}

// Generate strictly increasing timestamps
const now = (() => {
  let ts = 0
  return () => ++ts
})()

// Setup DOM events listeners for `focus` and `reconnect` actions
if (!IS_SERVER) {
  const revalidate = (revalidators: Record<string, Revalidator[]>) => {
    if (!defaultConfig.isDocumentVisible() || !defaultConfig.isOnline()) return

    for (const key in revalidators) {
      if (revalidators[key][0]) revalidators[key][0]()
    }
  }

  if (typeof defaultConfig.registerOnFocus === 'function') {
    defaultConfig.registerOnFocus(() => revalidate(FOCUS_REVALIDATORS))
  }

  if (typeof defaultConfig.registerOnReconnect === 'function') {
    defaultConfig.registerOnReconnect(() => revalidate(RECONNECT_REVALIDATORS))
  }
}

const trigger: Trigger = (_key, shouldRevalidate = true) => {
  // we are ignoring the second argument which correspond to the arguments
  // the fetcher will receive when key is an array
  const [key, , keyErr, keyValidating] = cache.serializeKey(_key)
  if (!key) return Promise.resolve()

  const updaters = CACHE_REVALIDATORS[key]

  if (key && updaters) {
    const currentData = cache.get(key)
    const currentError = cache.get(keyErr)
    const currentIsValidating = cache.get(keyValidating)
    const promises = []
    for (let i = 0; i < updaters.length; ++i) {
      promises.push(
        updaters[i](
          shouldRevalidate,
          currentData,
          currentError,
          currentIsValidating,
          i > 0
        )
      )
    }
    // return new updated value
    return Promise.all(promises).then(() => cache.get(key))
  }
  return Promise.resolve(cache.get(key))
}

const broadcastState: Broadcaster = (key, data, error, isValidating) => {
  const updaters = CACHE_REVALIDATORS[key]
  if (key && updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](false, data, error, isValidating)
    }
  }
}

const mutate: Mutator = async (_key, _data, shouldRevalidate = true) => {
  const [key, , keyErr] = cache.serializeKey(_key)
  if (!key) return

  // if there is no new data to update, let's just revalidate the key
  if (typeof _data === 'undefined') return trigger(_key, shouldRevalidate)

  // update global timestamps
  MUTATION_TS[key] = now() - 1
  MUTATION_END_TS[key] = 0

  // track timestamps before await asynchronously
  const beforeMutationTs = MUTATION_TS[key]
  const beforeConcurrentPromisesTs = CONCURRENT_PROMISES_TS[key]

  let data: any, error: unknown
  let isAsyncMutation = false

  if (_data && typeof _data === 'function') {
    // `_data` is a function, call it passing current cache value
    try {
      _data = _data(cache.get(key))
    } catch (err) {
      // if `_data` function throws an error synchronously, it shouldn't be cached
      _data = undefined
      error = err
    }
  }

  if (_data && typeof _data.then === 'function') {
    // `_data` is a promise
    isAsyncMutation = true
    try {
      data = await _data
    } catch (err) {
      error = err
    }
  } else {
    data = _data
  }

  const shouldAbort = (): boolean | void => {
    // check if other mutations have occurred since we've started this mutation
    if (
      beforeMutationTs !== MUTATION_TS[key] ||
      beforeConcurrentPromisesTs !== CONCURRENT_PROMISES_TS[key]
    ) {
      if (error) throw error
      return true
    }
  }

  // if there's a race we don't update cache or broadcast change, just return the data
  if (shouldAbort()) return data

  if (typeof data !== 'undefined') {
    // update cached data
    cache.set(key, data)
  }
  // always update or reset the error
  cache.set(keyErr, error)

  // reset the timestamp to mark the mutation has ended
  MUTATION_END_TS[key] = now() - 1

  if (!isAsyncMutation) {
    // we skip broadcasting if there's another mutation happened synchronously
    if (shouldAbort()) return data
  }

  // enter the revalidation stage
  // update existing SWR Hooks' state
  const updaters = CACHE_REVALIDATORS[key]
  if (updaters) {
    const promises = []
    for (let i = 0; i < updaters.length; ++i) {
      promises.push(
        updaters[i](!!shouldRevalidate, data, error, undefined, i > 0)
      )
    }
    // return new updated value
    return Promise.all(promises).then(() => {
      if (error) throw error
      return cache.get(key)
    })
  }
  // throw error or return data to be used by caller of mutate
  if (error) throw error
  return data
}

function useSWR<Data = any, Error = any>(
  ...args:
    | readonly [Key]
    | readonly [Key, Fetcher<Data> | null]
    | readonly [Key, SWRConfiguration<Data, Error> | undefined]
    | readonly [
        Key,
        Fetcher<Data> | null,
        SWRConfiguration<Data, Error> | undefined
      ]
): SWRResponse<Data, Error> {
  // Resolve arguments
  const _key = args[0]
  const config = Object.assign(
    {},
    defaultConfig,
    useContext(SWRConfigContext),
    args.length > 2
      ? args[2]
      : args.length === 2 && typeof args[1] === 'object'
      ? args[1]
      : {}
  )

  // In TypeScript `args.length > 2` is not same as `args.lenth === 3`.
  // We do a safe type assertion here.
  const fn = (args.length > 2
    ? args[1]
    : args.length === 2 && typeof args[1] === 'function'
    ? args[1]
    : /**
     * Pass fn as null will disable revalidate
     * https://paco.sh/blog/shared-hook-state-with-swr
     */
    args[1] === null
    ? args[1]
    : config.fetcher) as Fetcher<Data> | null

  // Utils
  const rerender = useState<object>({})[1]
  const addRevalidator = (
    revalidators: Record<string, Revalidator[]>,
    callback: Revalidator
  ) => {
    if (!revalidators[key]) {
      revalidators[key] = [callback]
    } else {
      revalidators[key].push(callback)
    }

    return () => {
      const keyedRevalidators = revalidators[key]
      const index = keyedRevalidators.indexOf(callback)

      if (index >= 0) {
        // O(1): faster than splice
        keyedRevalidators[index] =
          keyedRevalidators[keyedRevalidators.length - 1]
        keyedRevalidators.pop()
      }
    }
  }

  // `key` is the identifier of the SWR `data` state.
  // `keyErr` and `keyValidating` are indentifiers of `error` and `isValidating`
  // which are derived from `key`.
  // `fnArgs` is a list of arguments for `fn`.
  const [key, fnArgs, keyErr, keyValidating] = cache.serializeKey(_key)

  const configRef = useRef(config)
  useIsomorphicLayoutEffect(() => {
    configRef.current = config
  })

  // A revalidation must be triggered when mounted if:
  // - `revalidateOnMount` is explicitly set to `true`.
  // - There is no `initialData`, and `revalidateOnMount` is not set to `false`.
  const shouldRevalidateOnMount = () => {
    if (!key) return false
    return (
      config.revalidateOnMount ||
      (config.initialData === undefined && config.revalidateOnMount !== false)
    )
  }

  const resolveData = () => {
    const cachedData = cache.get(key)
    return cachedData === undefined ? config.initialData : cachedData
  }

  const initialData = resolveData()
  const initialError = cache.get(keyErr)
  const initialValidating =
    !!cache.get(keyValidating) || shouldRevalidateOnMount()

  // If a state property (data, error or isValidating) is accessed by the render
  // function, we mark the property as a dependency so if it is updated again
  // in the future, we trigger a rerender.
  // This is also known as dependency-tracking.
  const stateDependenciesRef = useRef({
    data: false,
    error: false,
    isValidating: false
  })
  const stateRef = useRef({
    data: initialData,
    error: initialError,
    isValidating: initialValidating
  })

  // display the data label in the React DevTools next to SWR hooks
  useDebugValue(stateRef.current.data)

  // error ref inside revalidate (is last request errored?)
  const unmountedRef = useRef(false)
  const keyRef = useRef(key)

  // check if component is mounted in suspense mode
  const initialMountedRef = useRef(false)

  // do unmount check for callbacks
  // do mounted check in suspense mode
  // if key changed during the revalidation, old dispatch and config callback should not take effect.
  const safeCallback = useCallback(
    (callback: () => void) => {
      if (unmountedRef.current) return
      if (!initialMountedRef.current) return
      if (key !== keyRef.current) return
      callback()
    },
    [key]
  )

  /**
   * @param payload when you want to change stateRef, you should pass value explicitly
   * @example
   * ```js
   * dispatch({
   *   isValidating: false
   *   data: newData // set data to newData
   *   error: undefined // set error to undefined
   * })
   *
   * dispatch({
   *   isValidating: false
   *   data: undefined // set data to undefined
   *   error: err // set error to err
   * })
   * ```
   */
  const dispatch = useCallback(
    (payload: Action<Data, Error>) =>
      safeCallback(() => {
        let shouldUpdateState = false
        for (const _ in Object.keys(payload)) {
          // Type casting to work around the `for...in` loop
          // https://github.com/Microsoft/TypeScript/issues/3500
          const k = _ as keyof Action<Data, Error>

          // If the property hasn't changed, skip
          if (stateRef.current[k] === payload[k]) {
            continue
          }

          // Update the state
          stateRef.current[k] = payload[k]

          // If the property is accessed by the component, a rerender should be
          // triggered.
          if (stateDependenciesRef.current[k]) {
            shouldUpdateState = true
          }
        }

        if (shouldUpdateState) {
          rerender({})
        }
      }),
    // config.suspense isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeCallback]
  )

  // `mutate`, but bound to the current key.
  const boundMutate: SWRResponse<Data, Error>['mutate'] = useCallback(
    (data, shouldRevalidate) => {
      return mutate(keyRef.current, data, shouldRevalidate)
    },
    []
  )

  // start a revalidation
  const revalidate = useCallback(
    async (revalidateOpts: RevalidatorOptions = {}): Promise<boolean> => {
      if (!key || !fn) return false
      if (unmountedRef.current) return false
      if (configRef.current.isPaused()) return false
      const { retryCount = 0, dedupe = false } = revalidateOpts

      let loading = true
      let shouldDeduping =
        typeof CONCURRENT_PROMISES[key] !== 'undefined' && dedupe

      // start fetching
      try {
        cache.set(keyValidating, true)
        dispatch({
          isValidating: true
        })
        if (!shouldDeduping) {
          // also update other hooks
          broadcastState(
            key,
            stateRef.current.data,
            stateRef.current.error,
            true
          )
        }

        let newData: Data
        let startAt

        if (shouldDeduping) {
          // there's already an ongoing request,
          // this one needs to be deduplicated.
          startAt = CONCURRENT_PROMISES_TS[key]
          newData = await CONCURRENT_PROMISES[key]
        } else {
          // if no cache being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && !cache.get(key)) {
            setTimeout(() => {
              if (loading)
                safeCallback(() => configRef.current.onLoadingSlow(key, config))
            }, config.loadingTimeout)
          }

          if (fnArgs !== null) {
            CONCURRENT_PROMISES[key] = fn(...fnArgs)
          } else {
            CONCURRENT_PROMISES[key] = fn(key)
          }

          CONCURRENT_PROMISES_TS[key] = startAt = now()

          newData = await CONCURRENT_PROMISES[key]

          setTimeout(() => {
            delete CONCURRENT_PROMISES[key]
            delete CONCURRENT_PROMISES_TS[key]
          }, config.dedupingInterval)

          // trigger the success event,
          // only do this for the original request.
          safeCallback(() => configRef.current.onSuccess(newData, key, config))
        }

        // if there're other ongoing request(s), started after the current one,
        // we need to ignore the current one to avoid possible race conditions:
        //   req1------------------>res1        (current one)
        //        req2---------------->res2
        // the request that fired later will always be kept.
        if (CONCURRENT_PROMISES_TS[key] > startAt) {
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
          MUTATION_TS[key] &&
          // case 1
          (startAt <= MUTATION_TS[key] ||
            // case 2
            startAt <= MUTATION_END_TS[key] ||
            // case 3
            MUTATION_END_TS[key] === 0)
        ) {
          dispatch({ isValidating: false })
          return false
        }

        cache.set(keyErr, undefined)
        cache.set(keyValidating, false)

        const newState: Action<Data, Error> = {
          error: undefined,
          isValidating: false
        }

        if (!config.compare(stateRef.current.data, newData)) {
          cache.set(key, newData)
          newState.data = newData
        }

        // merge the new state
        dispatch(newState)

        if (!shouldDeduping) {
          // also update other hooks
          broadcastState(key, newData, undefined, false)
        }
      } catch (err) {
        delete CONCURRENT_PROMISES[key]
        delete CONCURRENT_PROMISES_TS[key]
        if (configRef.current.isPaused()) {
          dispatch({
            isValidating: false
          })
          return false
        }

        // get a new error
        // don't use deep equal for errors
        cache.set(keyErr, err)

        // we keep the stale data
        dispatch({
          isValidating: false,
          error: err
        })

        if (!shouldDeduping) {
          // also broadcast to update other hooks
          broadcastState(key, undefined, err, false)
        }

        // events and retry
        safeCallback(() => configRef.current.onError(err, key, config))
        if (config.shouldRetryOnError) {
          // when retrying, we always enable deduping
          safeCallback(() =>
            configRef.current.onErrorRetry(err, key, config, revalidate, {
              retryCount: retryCount + 1,
              dedupe: true
            })
          )
        }
      }

      loading = false
      return true
    },
    // dispatch is immutable, and `eventsCallback`, `fnArgs`, `keyErr`, and `keyValidating` are based on `key`,
    // so we can them from the deps array.
    //
    // FIXME:
    // `fn` and `config` might be changed during the lifecycle,
    // but they might be changed every render like this.
    // useSWR('key', () => fetch('/api/'), { suspense: true })
    // So we omit the values from the deps array
    // even though it might cause unexpected behaviors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  )

  // Mounted, or key has changed
  useIsomorphicLayoutEffect(() => {
    if (!key) return undefined

    // First render
    const isUpdating = initialMountedRef.current

    // Mark the component as mounted and update corresponding refs.
    unmountedRef.current = false
    initialMountedRef.current = true
    keyRef.current = key

    // After the component mountes or key updates,
    // update the data from the cache and trigger a revalidation
    dispatch({
      data: initialData,
      error: initialError,
      isValidating: initialValidating
    })

    // revalidate with deduping
    const softRevalidate = () => revalidate({ dedupe: true })

    // trigger a revalidation
    if (isUpdating || shouldRevalidateOnMount()) {
      if (typeof initialData !== 'undefined' && !IS_SERVER) {
        // delay revalidate if there's cache
        // to not block the rendering

        // @ts-ignore it's safe to use requestAnimationFrame in browser
        rAF(softRevalidate)
      } else {
        softRevalidate()
      }
    }

    // Add event listeners

    let pending = false
    const onFocus = () => {
      if (pending || !configRef.current.revalidateOnFocus) return
      pending = true
      softRevalidate()
      setTimeout(
        () => (pending = false),
        configRef.current.focusThrottleInterval
      )
    }

    const onReconnect = () => {
      if (configRef.current.revalidateOnReconnect) {
        softRevalidate()
      }
    }

    // register global cache update listener
    const onUpdate: Updater<Data, Error> = (
      shouldRevalidate = true,
      updatedData,
      updatedError,
      updatedIsValidating,
      dedupe = true
    ) => {
      dispatch({
        error: updatedError,
        isValidating: updatedIsValidating,
        // if data is undefined we should not update stateRef.current.data
        ...(typeof updatedData !== 'undefined' && {
          data: updatedData
        })
      })

      if (shouldRevalidate) {
        if (dedupe) {
          return softRevalidate()
        } else {
          return revalidate()
        }
      }
      return false
    }

    const unsubFocus = addRevalidator(FOCUS_REVALIDATORS, onFocus)
    const unsubReconnect = addRevalidator(RECONNECT_REVALIDATORS, onReconnect)
    const unsubUpdate = addRevalidator(CACHE_REVALIDATORS, onUpdate)

    return () => {
      // mark it as unmounted
      unmountedRef.current = true

      unsubFocus()
      unsubReconnect()
      unsubUpdate()
    }
  }, [key, revalidate])

  // Polling
  useIsomorphicLayoutEffect(() => {
    let timer: any = null
    const tick = async () => {
      if (
        !stateRef.current.error &&
        (configRef.current.refreshWhenHidden ||
          configRef.current.isDocumentVisible()) &&
        (configRef.current.refreshWhenOffline || configRef.current.isOnline())
      ) {
        // only revalidate when the page is visible
        // if API request errored, we stop polling in this round
        // and let the error retry function handle it
        await revalidate({ dedupe: true })
      }
      // Read the latest refreshInterval
      if (configRef.current.refreshInterval && timer) {
        timer = setTimeout(tick, configRef.current.refreshInterval)
      }
    }
    if (configRef.current.refreshInterval) {
      timer = setTimeout(tick, configRef.current.refreshInterval)
    }
    return () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }, [
    config.refreshInterval,
    config.refreshWhenHidden,
    config.refreshWhenOffline,
    revalidate
  ])

  // Suspense
  let latestData: Data | undefined
  let latestError: unknown
  if (config.suspense) {
    // in suspense mode, we can't return empty state
    // (it should be suspended)

    // try to get data and error from cache
    latestData = cache.get(key)
    latestError = cache.get(keyErr)

    if (typeof latestData === 'undefined') {
      latestData = initialData
    }
    if (typeof latestError === 'undefined') {
      latestError = initialError
    }

    if (
      typeof latestData === 'undefined' &&
      typeof latestError === 'undefined'
    ) {
      // need to start the request if it hasn't
      if (!CONCURRENT_PROMISES[key]) {
        // trigger revalidate immediately
        // to get the promise
        // in this revalidate, should not rerender
        revalidate()
      }

      if (
        CONCURRENT_PROMISES[key] &&
        typeof CONCURRENT_PROMISES[key].then === 'function'
      ) {
        // if it is a promise
        throw CONCURRENT_PROMISES[key]
      }

      // it's a value, return it directly (override)
      latestData = CONCURRENT_PROMISES[key]
    }

    if (typeof latestData === 'undefined' && latestError) {
      // in suspense mode, throw error if there's no content
      throw latestError
    }
  }

  // after mounted, if stateRef does not sync with cache, we should update the stateRef and schedule another update with React
  dispatch({
    data: initialData,
    error: initialError
  })

  // Define the SWR state.
  // `revalidate` will be deprecated in the 1.x release
  // because `mutate()` covers the same use case of `revalidate()`.
  // This remains only for backward compatibility
  const state = {
    revalidate,
    mutate: boundMutate
  } as SWRResponse<Data, Error>

  Object.defineProperties(state, {
    error: {
      // `key` might be changed in the upcoming hook re-render,
      // but the previous state will stay
      // so we need to match the latest key and data (fallback to `initialData`)
      get: function() {
        stateDependenciesRef.current.error = true
        if (config.suspense) {
          return latestError
        }
        return key ? stateRef.current.error : initialError
      },
      enumerable: true
    },
    data: {
      get: function() {
        stateDependenciesRef.current.data = true
        if (config.suspense) {
          return latestData
        }
        return key ? stateRef.current.data : initialData
      },
      enumerable: true
    },
    isValidating: {
      get: function() {
        stateDependenciesRef.current.isValidating = true
        return key ? stateRef.current.isValidating : false
      },
      enumerable: true
    }
  })

  return state
}

Object.defineProperty(SWRConfigContext.Provider, 'default', {
  value: defaultConfig
})
const SWRConfig = SWRConfigContext.Provider as typeof SWRConfigContext.Provider & {
  default: SWRConfiguration
}

export { trigger, mutate, SWRConfig }
export default useSWR
