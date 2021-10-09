// We have to several type castings here because `useSWRInfinite` is a special
// hook where `key` and return type are not like the normal `useSWR` types.

import { useRef, useState, useCallback } from 'react'
import useSWR, {
  SWRConfig,
  Fetcher,
  SWRHook,
  MutatorCallback,
  Middleware,
  Arguments
} from 'swr'
import { useIsomorphicLayoutEffect } from '../src/utils/env'
import { serialize } from '../src/utils/serialize'
import { isUndefined, isFunction, UNDEFINED } from '../src/utils/helper'
import { withMiddleware } from '../src/utils/with-middleware'
import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  SWRInfiniteHook,
  InfiniteKeyLoader,
  InfiniteFetcher
} from './types'

const INFINITE_PREFIX = '$inf$'

const getFirstPageKey = (getKey: InfiniteKeyLoader) => {
  return serialize(getKey ? getKey(0, null) : null)[0]
}

export const unstable_serialize = (getKey: InfiniteKeyLoader) => {
  return INFINITE_PREFIX + getFirstPageKey(getKey)
}

export const infinite = ((<Data, Error, Args extends Arguments>(
  useSWRNext: SWRHook
) => (
  getKey: InfiniteKeyLoader<Args>,
  fn: Fetcher<Data> | null,
  config: typeof SWRConfig.default & SWRInfiniteConfiguration<Data, Error, Args>
): SWRInfiniteResponse<Data, Error> => {
  const rerender = useState({})[1]
  const didMountRef = useRef<boolean>(false)
  const dataRef = useRef<Readonly<Data[]>>()

  const {
    cache,
    initialSize = 1,
    revalidateAll = false,
    persistSize = false,
    revalidateFirstPage = true
  } = config

  // The serialized key of the first page.
  let firstPageKey: string | null = null
  try {
    firstPageKey = getFirstPageKey(getKey)
  } catch (err) {
    // not ready
  }

  // We use cache to pass extra info (context) to fetcher so it can be globally
  // shared. The key of the context data is based on the first page key.
  let contextCacheKey: string | null = null

  // Page size is also cached to share the page data between hooks with the
  // same key.
  let pageSizeCacheKey: string | null = null

  if (firstPageKey) {
    contextCacheKey = '$ctx$' + firstPageKey
    pageSizeCacheKey = '$len$' + firstPageKey
  }

  const resolvePageSize = useCallback((): number => {
    const cachedPageSize = cache.get(pageSizeCacheKey)
    return isUndefined(cachedPageSize) ? initialSize : cachedPageSize

    // `cache` isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSizeCacheKey, initialSize])
  // keep the last page size to restore it with the persistSize option
  const lastPageSizeRef = useRef<number>(resolvePageSize())

  // When the page key changes, we reset the page size if it's not persisted
  useIsomorphicLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    if (firstPageKey) {
      // If the key has been changed, we keep the current page size if persistSize is enabled
      cache.set(
        pageSizeCacheKey,
        persistSize ? lastPageSizeRef.current : initialSize
      )
    }

    // `initialSize` isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPageKey])

  // Actual SWR hook to load all pages in one fetcher.
  const swr = useSWRNext<Data[], Error>(
    firstPageKey ? INFINITE_PREFIX + firstPageKey : null,
    async () => {
      // get the revalidate context
      const [forceRevalidateAll, originalData] =
        cache.get(contextCacheKey) || []

      // return an array of page data
      const data: Data[] = []

      const pageSize = resolvePageSize()

      let previousPageData = null
      for (let i = 0; i < pageSize; ++i) {
        const [pageKey, pageArgs] = serialize(
          getKey ? getKey(i, previousPageData) : null
        )

        if (!pageKey) {
          // `pageKey` is falsy, stop fetching new pages.
          break
        }

        // Get the cached page data.
        let pageData = cache.get(pageKey)

        // should fetch (or revalidate) if:
        // - `revalidateAll` is enabled
        // - `mutate()` called
        // - the cache is missing
        // - it's the first page and it's not the initial render
        // - cache for that page has changed
        const shouldFetchPage =
          revalidateAll ||
          forceRevalidateAll ||
          isUndefined(pageData) ||
          (revalidateFirstPage && !i && !isUndefined(dataRef.current)) ||
          (originalData &&
            !isUndefined(originalData[i]) &&
            !config.compare(originalData[i], pageData))

        if (fn && shouldFetchPage) {
          pageData = await fn(...pageArgs)
          cache.set(pageKey, pageData)
        }

        data.push(pageData)
        previousPageData = pageData
      }

      // once we executed the data fetching based on the context, clear the context
      cache.delete(contextCacheKey)

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
    (
      data?:
        | Data[]
        | Readonly<Data[]>
        | Promise<Data[]>
        | Promise<Readonly<Data[]>>
        | MutatorCallback<Data[]>,
      shouldRevalidate = true
    ) => {
      // It is possible that the key is still falsy.
      if (!contextCacheKey) return

      if (shouldRevalidate && !isUndefined(data)) {
        // We only revalidate the pages that are changed
        const originalData = dataRef.current
        cache.set(contextCacheKey, [false, originalData])
      } else if (shouldRevalidate) {
        // Calling `mutate()`, we revalidate all pages
        cache.set(contextCacheKey, [true])
      }

      return swr.mutate(data, shouldRevalidate)
    },
    // swr.mutate is always the same reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextCacheKey]
  )

  // Function to load pages data from the cache based on the page size.
  const resolvePagesFromCache = (
    pageSize: number
  ): Readonly<Data[]> | undefined => {
    // return an array of page data
    const data: Data[] = []

    let previousPageData = null
    for (let i = 0; i < pageSize; ++i) {
      const [pageKey] = serialize(getKey ? getKey(i, previousPageData) : null)

      // Get the cached page data.
      const pageData = pageKey ? cache.get(pageKey) : UNDEFINED

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
      if (!pageSizeCacheKey) return

      let size
      if (isFunction(arg)) {
        size = arg(resolvePageSize())
      } else if (typeof arg == 'number') {
        size = arg
      }
      if (typeof size != 'number') return

      cache.set(pageSizeCacheKey, size)
      lastPageSizeRef.current = size
      rerender({})
      return mutate(resolvePagesFromCache(size))
    },
    // `cache` and `rerender` isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageSizeCacheKey, resolvePageSize, mutate]
  )

  // Use getter functions to avoid unnecessary re-renders caused by triggering
  // all the getters of the returned swr object.
  return {
    size: resolvePageSize(),
    setSize,
    mutate,
    get error() {
      return swr.error
    },
    get data() {
      return swr.data
    },
    get isValidating() {
      return swr.isValidating
    }
  } as SWRInfiniteResponse<Data, Error>
}) as unknown) as Middleware

export default withMiddleware(useSWR, infinite) as SWRInfiniteHook
export { SWRInfiniteConfiguration, SWRInfiniteResponse, InfiniteFetcher }
