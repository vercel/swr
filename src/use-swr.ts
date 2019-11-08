import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useContext,
  useCallback
} from 'react'
import { unstable_batchedUpdates } from './libs/reactBatchedUpdates'
import throttle from 'lodash/throttle'
import deepEqual from 'fast-deep-equal'

import {
  keyInterface,
  ConfigInterface,
  RevalidateOptionInterface,
  updaterInterface,
  triggerInterface,
  mutateInterface,
  broadcastStateInterface,
  responseInterface
} from './types'

import defaultConfig, {
  CONCURRENT_PROMISES,
  CONCURRENT_PROMISES_TS,
  FOCUS_REVALIDATORS,
  CACHE_REVALIDATORS,
  MUTATION_TS,
  cacheGet,
  cacheSet
} from './config'
import SWRConfigContext from './swr-config-context'
import isDocumentVisible from './libs/is-document-visible'
import useHydration from './libs/use-hydration'

const IS_SERVER = typeof window === 'undefined'

// TODO: introduce namepsace for the cache
const getErrorKey = key => (key ? 'err@' + key : '')

const trigger: triggerInterface = (key, shouldRevalidate = true) => {
  const updaters = CACHE_REVALIDATORS[key]
  if (key && updaters) {
    const currentData = cacheGet(key)
    const currentError = cacheGet(getErrorKey(key))
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](shouldRevalidate, currentData, currentError)
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

const mutate: mutateInterface = (key, data, shouldRevalidate = true) => {
  if (!key) return

  // update timestamp
  MUTATION_TS[key] = Date.now() - 1

  // update cached data
  cacheSet(key, data)

  // update existing SWR Hooks' state
  const updaters = CACHE_REVALIDATORS[key]
  if (updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](shouldRevalidate, data)
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
  fn?: Function,
  config?: ConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useSWR<Data = any, Error = any>(
  ...args
): responseInterface<Data, Error> {
  let _key: keyInterface,
    fn: Function | undefined,
    config: ConfigInterface<Data, Error> = {}
  if (args.length >= 1) {
    _key = args[0]
  }
  if (typeof args[1] === 'function') {
    fn = args[1]
  } else if (typeof args[1] === 'object') {
    config = args[1]
  }
  if (typeof args[2] === 'object') {
    config = args[2]
  }

  // we assume `key` as the identifier of the request
  // `key` can change but `fn` shouldn't
  // (because `revalidate` only depends on `key`)

  let key: string
  if (typeof _key === 'function') {
    try {
      key = _key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  } else {
    // convert null to ''
    key = String(_key || '')
  }

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

  // it is fine to call `useHydration` conditionally here
  // because `config.suspense` should never change
  const shouldReadCache = config.suspense || !useHydration()

  // stale: get from cache
  let [data, setData] = useState(shouldReadCache ? cacheGet(key) : undefined)
  let [error, setError] = useState(
    shouldReadCache ? cacheGet(keyErr) : undefined
  )

  // if there's any ongoing request
  let [isValidating, setIsValidating] = useState(false)

  // error ref inside revalidate (is last request errored?)
  const unmountedRef = useRef(false)
  const keyRef = useRef(key)
  const errorRef = useRef(error)
  const dataRef = useRef(data)

  // start a revalidation
  const revalidate = useCallback(
    async (
      revalidateOpts: RevalidateOptionInterface = {}
    ): Promise<boolean> => {
      if (!key) return false
      if (unmountedRef.current) return false
      revalidateOpts = Object.assign({ dedupe: false }, revalidateOpts)

      let loading = true
      let shouldDeduping =
        typeof CONCURRENT_PROMISES[key] !== 'undefined' && revalidateOpts.dedupe

      // start fetching
      try {
        setIsValidating(true)

        let newData
        let startAt

        if (shouldDeduping) {
          // there's already an ongoing request,
          // this one needs to be deduplicated.
          startAt = CONCURRENT_PROMISES_TS[key]
          newData = await CONCURRENT_PROMISES[key]
        } else {
          // if no cache being rendered currently (it shows a blank page),
          // we trigger the loading slow event.
          if (config.loadingTimeout && !cacheGet(key)) {
            setTimeout(() => {
              if (loading) config.onLoadingSlow(key, config)
            }, config.loadingTimeout)
          }

          CONCURRENT_PROMISES[key] = fn(key)
          CONCURRENT_PROMISES_TS[key] = startAt = Date.now()

          setTimeout(() => {
            delete CONCURRENT_PROMISES[key]
            delete CONCURRENT_PROMISES_TS[key]
          }, config.dedupingInterval)

          newData = await CONCURRENT_PROMISES[key]

          // trigger the success event,
          // only do this for the original request.
          config.onSuccess(newData, key, config)
        }

        // if the revalidation happened earlier than the local mutation,
        // we have to ignore the result because it could override.
        // meanwhile, a new revalidation should be triggered by the mutation.
        if (MUTATION_TS[key] && startAt <= MUTATION_TS[key]) {
          setIsValidating(false)
          return false
        }

        cacheSet(key, newData)
        cacheSet(keyErr, undefined)
        keyRef.current = key

        // batch state updates
        unstable_batchedUpdates(() => {
          setIsValidating(false)

          if (typeof errorRef.current !== 'undefined') {
            // we don't have an error
            setError(undefined)
            errorRef.current = undefined
          }
          if (deepEqual(dataRef.current, newData)) {
            // deep compare to avoid extra re-render
            // do nothing
          } else {
            // data changed
            setData(newData)
            dataRef.current = newData
          }

          if (!shouldDeduping) {
            // also update other hooks
            broadcastState(key, newData, undefined)
          }
        })
      } catch (err) {
        delete CONCURRENT_PROMISES[key]
        delete CONCURRENT_PROMISES_TS[key]

        cacheSet(keyErr, err)
        keyRef.current = key

        // get a new error
        // don't use deep equal for errors
        if (errorRef.current !== err) {
          errorRef.current = err

          unstable_batchedUpdates(() => {
            // we keep the stale data
            setIsValidating(false)
            setError(err)
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

  // React currently throws a warning when using useLayoutEffect on the server.
  // To get around it, we can conditionally useEffect on the server (no-op) and
  // useLayoutEffect in the browser.
  const useIsomorphicLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect

  // mounted (client side rendering)
  useIsomorphicLayoutEffect(() => {
    if (!key) return undefined

    // after `key` updates, we need to mark it as mounted
    unmountedRef.current = false

    // after the component is mounted (hydrated),
    // we need to update the data from the cache
    // and trigger a revalidation

    const currentHookData = dataRef.current
    const latestKeyedData = cacheGet(key)

    // update the state if the key changed or cache updated
    if (
      keyRef.current !== key ||
      !deepEqual(currentHookData, latestKeyedData)
    ) {
      setData(latestKeyedData)
      dataRef.current = latestKeyedData
      keyRef.current = key
    }

    // revalidate with deduping
    const softRevalidate = () => revalidate({ dedupe: true })

    // trigger a revalidation
    if (
      typeof latestKeyedData !== 'undefined' &&
      window['requestIdleCallback']
    ) {
      // delay revalidate if there's cache
      // to not block the rendering
      window['requestIdleCallback'](softRevalidate)
    } else {
      softRevalidate()
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
      updatedError
    ) => {
      // update hook state
      unstable_batchedUpdates(() => {
        if (
          typeof updatedData !== 'undefined' &&
          !deepEqual(dataRef.current, updatedData)
        ) {
          setData(updatedData)
          dataRef.current = updatedData
        }
        // always update error
        // because it can be `undefined`
        if (errorRef.current !== updatedError) {
          setError(updatedError)
          errorRef.current = updatedError
        }
        keyRef.current = key
      })

      if (shouldRevalidate) {
        return softRevalidate()
      }
      return false
    }

    // add updater to listeners
    if (!CACHE_REVALIDATORS[key]) {
      CACHE_REVALIDATORS[key] = [onUpdate]
    } else {
      CACHE_REVALIDATORS[key].push(onUpdate)
    }

    // set up polling
    let timeout = null
    if (config.refreshInterval) {
      const tick = async () => {
        if (
          !errorRef.current &&
          (config.refreshWhenHidden || isDocumentVisible())
        ) {
          // only revalidate when the page is visible
          // if API request errored, we stop polling in this round
          // and let the error retry function handle it
          await softRevalidate()
        }

        const interval = config.refreshInterval
        timeout = setTimeout(tick, interval)
      }
      timeout = setTimeout(tick, config.refreshInterval)
    }

    return () => {
      // cleanup
      setData = () => null
      setError = () => null
      setIsValidating = () => null

      // mark it as unmounted
      unmountedRef.current = true

      if (onFocus && FOCUS_REVALIDATORS[key]) {
        const index = FOCUS_REVALIDATORS[key].indexOf(onFocus)
        if (index >= 0) FOCUS_REVALIDATORS[key].splice(index, 1)
      }
      if (CACHE_REVALIDATORS[key]) {
        const index = CACHE_REVALIDATORS[key].indexOf(onUpdate)
        if (index >= 0) CACHE_REVALIDATORS[key].splice(index, 1)
      }

      if (timeout !== null) {
        clearTimeout(timeout)
      }
    }
  }, [key, config.refreshInterval, revalidate])

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
      isValidating
    }
  }

  return {
    error,
    // `key` might be changed in the upcoming hook re-render,
    // but the previous state will stay
    // so we need to match the latest key and data
    data: keyRef.current === key ? data : undefined,
    revalidate, // handler
    isValidating
  }
}

const SWRConfig = SWRConfigContext.Provider

export { trigger, mutate, SWRConfig }
export default useSWR
