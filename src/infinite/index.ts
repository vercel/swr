// We have to several type castings here because `useSWRInfinite` is a special
// hook where `key` and return type are not like the normal `useSWR` types.

import { useRef, useCallback } from 'react'
import type { SWRConfig } from 'swr'
import useSWR from 'swr'
import {
  isUndefined,
  isFunction,
  UNDEFINED,
  createCacheHelper,
  useIsomorphicLayoutEffect,
  serialize,
  withMiddleware
} from 'swr/_internal'
import type {
  BareFetcher,
  SWRHook,
  MutatorCallback,
  Middleware,
  MutatorOptions
} from 'swr/_internal'
import type {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
  SWRInfiniteFetcher,
  SWRInfiniteCacheValue
} from './types'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'

const INFINITE_PREFIX = '$inf$'
const EMPTY_PROMISE = Promise.resolve() as Promise<undefined>

const getFirstPageKey = (getKey: SWRInfiniteKeyLoader) => {
  return serialize(getKey ? getKey(0, null) : null)[0]
}

export const unstable_serialize = (getKey: SWRInfiniteKeyLoader) => {
  return INFINITE_PREFIX + getFirstPageKey(getKey)
}

export const infinite = (<Data, Error>(useSWRNext: SWRHook) =>
  (
    getKey: SWRInfiniteKeyLoader,
    fn: BareFetcher<Data> | null,
    config: Omit<typeof SWRConfig.defaultValue, 'fetcher'> &
      Omit<SWRInfiniteConfiguration<Data, Error>, 'fetcher'>
  ): SWRInfiniteResponse<Data, Error> => {
    const didMountRef = useRef<boolean>(false)
    const dataRef = useRef<Data[]>()

    const {
      cache,
      initialSize = 1,
      revalidateAll = false,
      persistSize = false,
      revalidateFirstPage = true,
      revalidateOnMount = false
    } = config

    // The serialized key of the first page. This key will be used to store
    // metadata of this SWR infinite hook.
    let infiniteKey: string | undefined
    try {
      infiniteKey = getFirstPageKey(getKey)
      if (infiniteKey) infiniteKey = INFINITE_PREFIX + infiniteKey
    } catch (err) {
      // Not ready yet.
    }

    const [get, set, subscribeCache] = createCacheHelper<
      Data,
      SWRInfiniteCacheValue<Data, any>
    >(cache, infiniteKey)

    const getSnapshot = useCallback(() => {
      const size = isUndefined(get()._l) ? initialSize : get()._l
      return size
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache, infiniteKey, initialSize])
    useSyncExternalStore(
      useCallback(
        (callback: () => void) => {
          if (infiniteKey)
            return subscribeCache(infiniteKey, () => {
              callback()
            })
          return () => {}
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cache, infiniteKey]
      ),
      getSnapshot,
      getSnapshot
    )

    const resolvePageSize = useCallback((): number => {
      const cachedPageSize = get()._l
      return isUndefined(cachedPageSize) ? initialSize : cachedPageSize

      // `cache` isn't allowed to change during the lifecycle
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infiniteKey, initialSize])
    // keep the last page size to restore it with the persistSize option
    const lastPageSizeRef = useRef<number>(resolvePageSize())

    // When the page key changes, we reset the page size if it's not persisted
    useIsomorphicLayoutEffect(() => {
      if (!didMountRef.current) {
        didMountRef.current = true
        return
      }

      if (infiniteKey) {
        // If the key has been changed, we keep the current page size if persistSize is enabled
        set({ _l: persistSize ? lastPageSizeRef.current : initialSize })
      }

      // `initialSize` isn't allowed to change during the lifecycle
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infiniteKey, cache])

    // Needs to check didMountRef during mounting, not in the fetcher
    const shouldRevalidateOnMount = revalidateOnMount && !didMountRef.current

    // Actual SWR hook to load all pages in one fetcher.
    const swr = useSWRNext<Data[], Error>(
      infiniteKey,
      async () => {
        // get the revalidate context
        const [forceRevalidateAll, originalData] = get()._i || []

        // return an array of page data
        const data: Data[] = []

        const pageSize = resolvePageSize()

        let previousPageData = null
        for (let i = 0; i < pageSize; ++i) {
          const [pageKey, pageArg] = serialize(getKey(i, previousPageData))

          if (!pageKey) {
            // `pageKey` is falsy, stop fetching new pages.
            break
          }

          const [getSWRCache, setSWRCache] = createCacheHelper<
            Data,
            SWRInfiniteCacheValue<Data, any>
          >(cache, pageKey)

          // Get the cached page data.
          let pageData = getSWRCache().data as Data

          // should fetch (or revalidate) if:
          // - `revalidateAll` is enabled
          // - `mutate()` called
          // - the cache is missing
          // - it's the first page and it's not the initial render
          // - `revalidateOnMount` is enabled and it's on mount
          // - cache for that page has changed
          const shouldFetchPage =
            revalidateAll ||
            forceRevalidateAll ||
            isUndefined(pageData) ||
            (revalidateFirstPage && !i && !isUndefined(dataRef.current)) ||
            shouldRevalidateOnMount ||
            (originalData &&
              !isUndefined(originalData[i]) &&
              !config.compare(originalData[i], pageData))

          if (fn && shouldFetchPage) {
            pageData = await fn(pageArg)
            setSWRCache({ data: pageData, _k: pageArg })
          }
          data.push(pageData)
          previousPageData = pageData
        }

        // once we executed the data fetching based on the context, clear the context
        set({ _i: UNDEFINED })

        // return the data
        return data
      },
      config
    )

    // update dataRef
    useIsomorphicLayoutEffect(() => {
      dataRef.current = swr.data
    }, [swr.data])

    const mutate = useCallback(
      // eslint-disable-next-line func-names
      function (
        data?: undefined | Data[] | Promise<Data[]> | MutatorCallback<Data[]>,
        opts?: undefined | boolean | MutatorOptions<Data[]>
      ) {
        // When passing as a boolean, it's explicitly used to disable/enable
        // revalidation.
        const options =
          typeof opts === 'boolean' ? { revalidate: opts } : opts || {}

        // Default to true.
        const shouldRevalidate = options.revalidate !== false

        // It is possible that the key is still falsy.
        if (!infiniteKey) return EMPTY_PROMISE

        if (shouldRevalidate) {
          if (!isUndefined(data)) {
            // We only revalidate the pages that are changed
            const originalData = dataRef.current
            set({ _i: [false, originalData] })
          } else {
            // Calling `mutate()`, we revalidate all pages
            set({ _i: [true] })
          }
        }

        return arguments.length
          ? swr.mutate(data, shouldRevalidate)
          : swr.mutate()
      },
      // swr.mutate is always the same reference
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [infiniteKey, cache]
    )

    // Function to load pages data from the cache based on the page size.
    const resolvePagesFromCache = (pageSize: number): Data[] | undefined => {
      // return an array of page data
      const data: Data[] = []

      let previousPageData = null
      for (let i = 0; i < pageSize; ++i) {
        const [pageKey] = serialize(getKey(i, previousPageData))

        // Get the cached page data.
        const pageData = pageKey ? cache.get(pageKey)?.data : UNDEFINED

        // Return the current data if we can't get it from the cache.
        if (isUndefined(pageData)) return dataRef.current

        data.push(pageData)
        previousPageData = pageData
      }

      // Return the data
      return data
    }

    // Extend the SWR API
    const setSize = useCallback(
      (arg: number | ((size: number) => number)) => {
        // It is possible that the key is still falsy.
        if (!infiniteKey) return EMPTY_PROMISE

        let size
        if (isFunction(arg)) {
          size = arg(resolvePageSize())
        } else if (typeof arg == 'number') {
          size = arg
        }
        if (typeof size != 'number') return EMPTY_PROMISE

        set({ _l: size })
        lastPageSizeRef.current = size
        return mutate(resolvePagesFromCache(size))
      },
      // `cache` and `rerender` isn't allowed to change during the lifecycle
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [infiniteKey, resolvePageSize, mutate, cache]
    )

    // Use getter functions to avoid unnecessary re-renders caused by triggering
    // all the getters of the returned swr object.
    return {
      size: resolvePageSize(),
      setSize,
      mutate,
      get data() {
        return swr.data
      },
      get error() {
        return swr.error
      },
      get isValidating() {
        return swr.isValidating
      },
      get isLoading() {
        return swr.isLoading
      }
    }
  }) as unknown as Middleware

export default withMiddleware(useSWR, infinite) as SWRInfiniteHook

export {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  SWRInfiniteHook,
  SWRInfiniteKeyLoader,
  SWRInfiniteFetcher
}
