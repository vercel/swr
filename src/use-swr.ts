import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo
} from 'react'

import defaultConfig, {
  cacheGet,
  cacheSet,
  CACHE_REVALIDATORS,
  CONCURRENT_PROMISES,
  CONCURRENT_PROMISES_TS,
  FOCUS_REVALIDATORS,
  MUTATION_TS
} from './config'
import hash from './libs/hash'
import isDocumentVisible from './libs/is-document-visible'
import isOnline from './libs/is-online'
import throttle from './libs/throttle'
import SWRConfigContext from './swr-config-context'
import {
  actionType,
  broadcastStateInterface,
  ConfigInterface,
  fetcherFn,
  keyInterface,
  mutateInterface,
  responseInterface,
  RevalidateOptionInterface,
  triggerInterface,
  updaterInterface
} from './types'

const IS_SERVER = typeof window === 'undefined'

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.
const useIsomorphicLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect

// TODO: introduce namepsace for the cache
const getErrorKey = key => (key ? 'err@' + key : '')
const getKeyArgs = key => {
  let args = null
  if (typeof key === 'function') {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  if (Array.isArray(key)) {
    // args array
    args = key
    key = hash(key)
  } else {
    // convert null to ''
    key = String(key || '')
  }

  return [key, args]
}

const trigger: triggerInterface = (_key, shouldRevalidate = true) => {
  const [key] = getKeyArgs(_key)
  if (!key) return

  const updaters = CACHE_REVALIDATORS[key]
  if (key && updaters) {
    const currentData = cacheGet(key)
    const currentError = cacheGet(getErrorKey(key))
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](shouldRevalidate, currentData, currentError, true)
    }
  }
}

const broadcastState: broadcastStateInterface = (key, data, error) => {
  const updaters = CACHE_REVALIDATORS[key]
  if (key && updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](false, data, error)
    }
  }
}

const mutate: mutateInterface = async (_key, _data, shouldRevalidate) => {
  const [key] = getKeyArgs(_key)
  if (!key) return

  // update timestamp
  MUTATION_TS[key] = Date.now() - 1

  let data, error

  if (_data && typeof _data.then === 'function') {
    // `_data` is a promise
    try {
      data = await _data
    } catch (err) {
      error = err
    }
  } else {
    data = _data

    if (typeof shouldRevalidate === 'undefined') {
      // if it's a sync mutation, we trigger the revalidation by default
      // because in most cases it's a local mutation
      shouldRevalidate = true
    }
  }

  if (typeof data !== 'undefined') {
    // update cached data
    cacheSet(key, data)
  }

  // update existing SWR Hooks' state
  const updaters = CACHE_REVALIDATORS[key]
  if (updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](!!shouldRevalidate, data, error, true)
    }
  }
}

function useSWR<Data = any, Error = any>(
  key: keyInterface
): responseInterface<Data, Error>
function useSWR<Data = any, Error = any>(
  key: keyInterface,
  config?: ConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useSWR<Data = any, Error = any>(
  key: keyInterface,
  fn?: fetcherFn<Data>,
  config?: ConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useSWR<Data = any, Error = any>(
  ...args
): responseInterface<Data, Error> {
  let _key: keyInterface,
    fn: fetcherFn<Data> | undefined,
    config: ConfigInterface<Data, Error> = {}
  if (args.length >= 1) {
    _key = args[0]
  }
  if (args.length > 2) {
    fn = args[1]
    config = args[2]
  } else {
    if (typeof args[1] === 'function') {
      fn = args[1]
    } else if (typeof args[1] === 'object') {
      config = args[1]
    }
  }

  // we assume `key` as the identifier of the request
  // `key` can change but `fn` shouldn't
  // (because `revalidate` only depends on `key`)
  const [key, fnArgs] = getKeyArgs(_key)

  // `keyErr` is the cache key for error objects
  const keyErr = getErrorKey(key)

  config = Object.assign(
    {},
    defaultConfig,
    useContext(SWRConfigContext),
    config
  )

  if (typeof fn === 'undefined') {
    // use a global fetcher
    fn = config.fetcher
  }

  const initialData = cacheGet(key) || config.initialData
  const initialError = cacheGet(keyErr)

  // if a state is accessed (data, error or isValidating),
  // we add the state to dependencies so if the state is
  // updated in the future, we can trigger a rerender
  const stateDependencies = useRef({
    data: false,
    error: false,
    isValidating: false
  })
  const stateRef = useRef({
    data: initialData,
    error: initialError,
    isValidating: false
  })

  const rerender = useState(null)[1]
  let dispatch = useCallback(payload => {
    let shouldUpdateState = false
    for (let k in payload) {
      stateRef.current[k] = payload[k]
      if (stateDependencies.current[k]) {
        shouldUpdateState = true
      }
    }
    if (shouldUpdateState || config.suspense) {
      rerender({})
    }
  }, [])

  // error ref inside revalidate (is last request errored?)
  const unmountedRef = useRef(false)
  const keyRef = useRef(key)

  // start a revalidation
  const revalidate = useCallback(
    async (
      revalidateOpts: RevalidateOptionInterface = {}
    ): Promise<boolean> => {
      if (!key || !fn) return false
      if (unmountedRef.current) return false
      revalidateOpts = Object.assign({ dedupe: false }, revalidateOpts)

      let loading = true
      let shouldDeduping =
        typeof CONCURRENT_PROMISES[key] !== 'undefined' && revalidateOpts.dedupe

      // start fetching
      try {
        dispatch({
          isValidating: true
        })

        let newData
        let startAt

        if (shouldDeduping) {
          // there's already an ongoing request,
          // this one needs to be deduplicated.
          startAt = CONCURRENT_PROMISES_TS[key]
          newData = await CONCURRENT_PROMISES[key]
        } else {
          // if not deduping the request (hard revalidate) but
          // there're other ongoing request(s) at the same time,
          // we need to ignore the other result(s) to avoid
          // possible race conditions:
          // req1------------------>res1
          //      req2-------->res2
          // in that case, the second response should not be overridden
          // by the first one.
          if (CONCURRENT_PROMISES[key]) {
            // we can mark it as a mutation to ignore
            // all requests which are fired before this one
            MUTATION_TS[key] = Date.now() - 1
          }

          // if no cache being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && !cacheGet(key)) {
            setTimeout(() => {
              if (loading) config.onLoadingSlow(key, config)
            }, config.loadingTimeout)
          }

          if (fnArgs !== null) {
            CONCURRENT_PROMISES[key] = fn(...fnArgs)
          } else {
            CONCURRENT_PROMISES[key] = fn(key)
          }

          CONCURRENT_PROMISES_TS[key] = startAt = Date.now()

          newData = await CONCURRENT_PROMISES[key]

          setTimeout(() => {
            delete CONCURRENT_PROMISES[key]
            delete CONCURRENT_PROMISES_TS[key]
          }, config.dedupingInterval)

          // trigger the success event,
          // only do this for the original request.
          config.onSuccess(newData, key, config)
        }

        // if the revalidation happened earlier than the local mutation,
        // we have to ignore the result because it could override.
        // meanwhile, a new revalidation should be triggered by the mutation.
        if (MUTATION_TS[key] && startAt <= MUTATION_TS[key]) {
          dispatch({ isValidating: false })
          return false
        }

        cacheSet(key, newData)
        cacheSet(keyErr, undefined)
        keyRef.current = key

        // new state for the reducer
        const newState: actionType<Data, Error> = {
          isValidating: false
        }

        if (typeof stateRef.current.error !== 'undefined') {
          // we don't have an error
          newState.error = undefined
        }
        if (config.compare(stateRef.current.data, newData)) {
          // deep compare to avoid extra re-render
          // do nothing
        } else {
          // data changed
          newState.data = newData
        }

        // merge the new state
        dispatch(newState)

        if (!shouldDeduping) {
          // also update other hooks
          broadcastState(key, newData, undefined)
        }
      } catch (err) {
        delete CONCURRENT_PROMISES[key]
        delete CONCURRENT_PROMISES_TS[key]

        cacheSet(keyErr, err)
        keyRef.current = key

        // get a new error
        // don't use deep equal for errors
        if (stateRef.current.error !== err) {
          // we keep the stale data
          dispatch({
            isValidating: false,
            error: err
          })

          if (!shouldDeduping) {
            // also broadcast to update other hooks
            broadcastState(key, undefined, err)
          }
        }

        // events and retry
        config.onError(err, key, config)
        if (config.shouldRetryOnError) {
          // when retrying, we always enable deduping
          const retryCount = (revalidateOpts.retryCount || 0) + 1
          config.onErrorRetry(
            err,
            key,
            config,
            revalidate,
            Object.assign({ dedupe: true }, revalidateOpts, { retryCount })
          )
        }
      }

      loading = false
      return true
    },
    [key]
  )

  // mounted (client side rendering)
  useIsomorphicLayoutEffect(() => {
    if (!key) return undefined

    // after `key` updates, we need to mark it as mounted
    unmountedRef.current = false

    // after the component is mounted (hydrated),
    // we need to update the data from the cache
    // and trigger a revalidation

    const currentHookData = stateRef.current.data
    const latestKeyedData = cacheGet(key) || config.initialData

    // update the state if the key changed or cache updated
    if (
      keyRef.current !== key ||
      !config.compare(currentHookData, latestKeyedData)
    ) {
      dispatch({ data: latestKeyedData })
      keyRef.current = key
    }

    // revalidate with deduping
    const softRevalidate = () => revalidate({ dedupe: true })

    // trigger a revalidation
    if (!config.initialData) {
      if (
        typeof latestKeyedData !== 'undefined' &&
        !IS_SERVER &&
        window['requestIdleCallback']
      ) {
        // delay revalidate if there's cache
        // to not block the rendering
        window['requestIdleCallback'](softRevalidate)
      } else {
        softRevalidate()
      }
    }

    // whenever the window gets focused, revalidate
    let onFocus
    if (config.revalidateOnFocus) {
      // throttle: avoid being called twice from both listeners
      // and tabs being switched quickly
      onFocus = throttle(softRevalidate, config.focusThrottleInterval)
      if (!FOCUS_REVALIDATORS[key]) {
        FOCUS_REVALIDATORS[key] = [onFocus]
      } else {
        FOCUS_REVALIDATORS[key].push(onFocus)
      }
    }

    // register global cache update listener
    const onUpdate: updaterInterface<Data, Error> = (
      shouldRevalidate = true,
      updatedData,
      updatedError,
      dedupe = true
    ) => {
      // update hook state
      const newState: actionType<Data, Error> = {}
      let needUpdate = false

      if (
        typeof updatedData !== 'undefined' &&
        !config.compare(stateRef.current.data, updatedData)
      ) {
        newState.data = updatedData
        needUpdate = true
      }

      // always update error
      // because it can be `undefined`
      if (stateRef.current.error !== updatedError) {
        newState.error = updatedError
        needUpdate = true
      }

      if (needUpdate) {
        dispatch(newState)
      }

      keyRef.current = key
      if (shouldRevalidate) {
        if (dedupe) {
          return softRevalidate()
        } else {
          return revalidate()
        }
      }
      return false
    }

    // add updater to listeners
    if (!CACHE_REVALIDATORS[key]) {
      CACHE_REVALIDATORS[key] = [onUpdate]
    } else {
      CACHE_REVALIDATORS[key].push(onUpdate)
    }

    // set up reconnecting when the browser regains network connection
    let reconnect = null
    if (
      typeof addEventListener !== 'undefined' &&
      config.revalidateOnReconnect
    ) {
      reconnect = addEventListener('online', softRevalidate)
    }

    return () => {
      // cleanup
      dispatch = () => null

      // mark it as unmounted
      unmountedRef.current = true

      if (onFocus && FOCUS_REVALIDATORS[key]) {
        const revalidators = FOCUS_REVALIDATORS[key]
        const index = revalidators.indexOf(onFocus)
        if (index >= 0) {
          // 10x faster than splice
          // https://jsperf.com/array-remove-by-index
          revalidators[index] = revalidators[revalidators.length - 1]
          revalidators.pop()
        }
      }
      if (CACHE_REVALIDATORS[key]) {
        const revalidators = CACHE_REVALIDATORS[key]
        const index = revalidators.indexOf(onUpdate)
        if (index >= 0) {
          revalidators[index] = revalidators[revalidators.length - 1]
          revalidators.pop()
        }
      }

      if (typeof removeEventListener !== 'undefined' && reconnect !== null) {
        removeEventListener('online', reconnect)
      }
    }
  }, [key, revalidate])

  // set up polling
  useIsomorphicLayoutEffect(() => {
    let timer = null
    const tick = async () => {
      if (
        !stateRef.current.error &&
        (config.refreshWhenHidden || isDocumentVisible()) &&
        (!config.refreshWhenOffline && isOnline())
      ) {
        // only revalidate when the page is visible
        // if API request errored, we stop polling in this round
        // and let the error retry function handle it
        await revalidate({ dedupe: true })
      }
      if (config.refreshInterval) {
        timer = setTimeout(tick, config.refreshInterval)
      }
    }
    if (config.refreshInterval) {
      timer = setTimeout(tick, config.refreshInterval)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [
    config.refreshInterval,
    config.refreshWhenHidden,
    config.refreshWhenOffline,
    revalidate
  ])

  // suspense
  if (config.suspense) {
    if (IS_SERVER)
      throw new Error('Suspense on server side is not yet supported!')

    // in suspense mode, we can't return empty state
    // (it should be suspended)

    // try to get data and error from cache
    let latestData = cacheGet(key)
    let latestError = cacheGet(keyErr)

    if (
      typeof latestData === 'undefined' &&
      typeof latestError === 'undefined'
    ) {
      // need to start the request if it hasn't
      if (!CONCURRENT_PROMISES[key]) {
        // trigger revalidate immediately
        // to get the promise
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

    // return the latest data / error from cache
    // in case `key` has changed
    return {
      error: latestError,
      data: latestData,
      revalidate,
      isValidating: stateRef.current.isValidating
    }
  }

  // define returned state
  // can be memorized since the state is a ref
  return useMemo(() => {
    const state = { revalidate } as responseInterface<Data, Error>
    Object.defineProperties(state, {
      error: {
        // `key` might be changed in the upcoming hook re-render,
        // but the previous state will stay
        // so we need to match the latest key and data (fallback to `initialData`)
        get: function() {
          stateDependencies.current.error = true
          return keyRef.current === key ? stateRef.current.error : initialError
        }
      },
      data: {
        get: function() {
          stateDependencies.current.data = true
          return keyRef.current === key ? stateRef.current.data : initialData
        }
      },
      isValidating: {
        get: function() {
          stateDependencies.current.isValidating = true
          return stateRef.current.isValidating
        }
      }
    })

    return state
  }, [revalidate])
}

const SWRConfig = SWRConfigContext.Provider

export { trigger, mutate, SWRConfig }
export default useSWR
