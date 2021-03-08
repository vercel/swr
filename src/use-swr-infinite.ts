// TODO: use @ts-expect-error
import { useContext, useRef, useState, useEffect, useCallback } from 'react'

import defaultConfig, { cache } from './config'
import SWRConfigContext from './swr-config-context'
import useSWR from './use-swr'

import {
  ValueKey,
  Fetcher,
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  MutatorCallback
} from './types'

type KeyLoader<Data = any> = (
  index: number,
  previousPageData: Data | null
) => ValueKey

function useSWRInfinite<Data = any, Error = any>(
  ...args:
    | readonly [KeyLoader<Data>]
    | readonly [KeyLoader<Data>, Fetcher<Data>]
    | readonly [KeyLoader<Data>, SWRInfiniteConfiguration<Data, Error>]
    | readonly [
        KeyLoader<Data>,
        Fetcher<Data>,
        SWRInfiniteConfiguration<Data, Error>
      ]
): SWRInfiniteResponse<Data, Error> {
  const getKey = args[0]

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
  // in typescript args.length > 2 is not same as args.lenth === 3
  // we do a safe type assertion here
  // args.length === 3
  const fn = (args.length > 2
    ? args[1]
    : args.length === 2 && typeof args[1] === 'function'
    ? args[1]
    : config.fetcher) as Fetcher<Data>

  const {
    initialSize = 1,
    revalidateAll = false,
    persistSize = false,
    ...extraConfig
  } = config

  // get the serialized key of the first page
  let firstPageKey: string | null = null
  try {
    ;[firstPageKey] = cache.serializeKey(getKey(0, null))
  } catch (err) {
    // not ready
  }

  const [, rerender] = useState<boolean>(false)

  // we use cache to pass extra info (context) to fetcher so it can be globally shared
  // here we get the key of the fetcher context cache
  let contextCacheKey: string | null = null
  if (firstPageKey) {
    contextCacheKey = 'context@' + firstPageKey
  }

  // page count is cached as well, so when navigating the list can be restored
  let pageCountCacheKey: string | null = null
  let cachedPageSize
  if (firstPageKey) {
    pageCountCacheKey = 'size@' + firstPageKey
    cachedPageSize = cache.get(pageCountCacheKey)
  }
  const pageCountRef = useRef<number>(cachedPageSize || initialSize)
  const didMountRef = useRef<boolean>(false)

  // every time the key changes, we reset the page size if it's not persisted
  useEffect(() => {
    if (didMountRef.current) {
      if (!persistSize) {
        pageCountRef.current = initialSize
      }
    } else {
      didMountRef.current = true
    }
    // initialSize isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPageKey])

  // keep the data inside a ref
  const dataRef = useRef<Data[]>()

  // actual swr of all pages
  const swr = useSWR<Data[], Error>(
    firstPageKey ? ['many', firstPageKey] : null,
    async () => {
      // get the revalidate context
      const { originalData, force } = cache.get(contextCacheKey) || {}

      // return an array of page data
      const data: Data[] = []

      let previousPageData = null
      for (let i = 0; i < pageCountRef.current; ++i) {
        const [pageKey, pageArgs] = cache.serializeKey(
          getKey(i, previousPageData)
        )

        if (!pageKey) {
          // pageKey is falsy, stop fetching next pages
          break
        }

        // get the current page cache
        let pageData = cache.get(pageKey)

        // should fetch (or revalidate) if:
        // - `revalidateAll` is enabled
        // - `mutate()` called
        // - the cache is missing
        // - it's the first page and it's not the first render
        // - cache has changed
        const shouldFetchPage =
          revalidateAll ||
          force ||
          typeof pageData === 'undefined' ||
          (typeof force === 'undefined' &&
            i === 0 &&
            typeof dataRef.current !== 'undefined') ||
          (originalData && !config.compare(originalData[i], pageData))

        if (shouldFetchPage) {
          if (pageArgs !== null) {
            pageData = await fn(...pageArgs)
          } else {
            pageData = await fn(pageKey)
          }
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
    extraConfig
  )

  // update dataRef
  useEffect(() => {
    dataRef.current = swr.data
  }, [swr.data])

  const mutate = useCallback(
    (data: MutatorCallback, shouldRevalidate = true) => {
      if (shouldRevalidate && typeof data !== 'undefined') {
        // we only revalidate the pages that are changed
        const originalData = dataRef.current
        cache.set(contextCacheKey, { originalData, force: false })
      } else if (shouldRevalidate) {
        // calling `mutate()`, we revalidate all pages
        cache.set(contextCacheKey, { force: true })
      }

      return swr.mutate(data, shouldRevalidate)
    },
    // swr.mutate is always the same reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextCacheKey]
  )

  // extend the SWR API
  const size = pageCountRef.current
  const setSize = useCallback(
    arg => {
      if (typeof arg === 'function') {
        pageCountRef.current = arg(pageCountRef.current)
      } else if (typeof arg === 'number') {
        pageCountRef.current = arg
      }
      cache.set(pageCountCacheKey, pageCountRef.current)
      rerender(v => !v)
      return mutate(v => v)
    },
    [mutate, pageCountCacheKey]
  )

  // Use getter functions to avoid unnecessary re-renders caused by triggering all the getters of the returned swr object
  const swrInfinite = { size, setSize, mutate }
  Object.defineProperties(swrInfinite, {
    error: {
      get: () => swr.error,
      enumerable: true
    },
    data: {
      get: () => swr.data,
      enumerable: true
    },
    // revalidate will be deprecated in the 1.x release
    // because mutate() covers the same use case of revalidate().
    // This remains only for backward compatibility
    revalidate: {
      get: () => swr.revalidate,
      enumerable: true
    },
    isValidating: {
      get: () => swr.isValidating,
      enumerable: true
    }
  })
  return (swrInfinite as unknown) as SWRInfiniteResponse<Data, Error>
}

export { useSWRInfinite }
