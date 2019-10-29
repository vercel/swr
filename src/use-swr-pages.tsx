import React, { useCallback, useMemo, useState, useRef } from 'react'

import { cacheGet, cacheSet } from './config'
import {
  pagesResponseInterface,
  responseInterface,
  pageComponentType,
  pageOffsetMapperType
} from './types'

export function useSWRPages<OffsetType>(
  pageKey: string,
  pageFn: pageComponentType,
  swrDataToOffset: pageOffsetMapperType<OffsetType>,
  deps: any[] = []
): pagesResponseInterface {
  const pageCountKey = `_swr_page_count_` + pageKey
  const pageOffsetKey = `_swr_page_offset_` + pageKey

  const [pageCount, setPageCount] = useState<number>(
    cacheGet(pageCountKey) || 1
  )
  const [pageOffsets, setPageOffsets] = useState<OffsetType[]>(
    cacheGet(pageOffsetKey) || [null]
  )
  const [pageSWRs, setPageSWRs] = useState<responseInterface<any, any>[]>([])

  const pageCacheRef = useRef([])
  const pageFnRef = useRef(pageFn)
  const emptyPageRef = useRef(false)

  // Page component (wraps `pageFn`)
  // for performance reason we need to memorize it
  const Page = useCallback(props => {
    // render the page component
    const dataList = pageFnRef.current(props)

    // if dataList is [], we can assume this page is empty
    // TODO: this API is not stable
    if (dataList && !dataList.length) {
      emptyPageRef.current = true
    } else {
      emptyPageRef.current = false
    }

    return dataList
  }, [])

  // Doesn't have a next page
  const isReachingEnd = pageOffsets[pageCount] === null
  const isLoadingMore = pageCount === pageOffsets.length
  const isEmpty = isReachingEnd && pageCount === 1 && emptyPageRef.current
  const loadMore = useCallback(() => {
    if (isLoadingMore || isReachingEnd) return
    setPageCount(c => {
      cacheSet(pageCountKey, c + 1)
      return c + 1
    })
  }, [isLoadingMore || isReachingEnd])

  const pages = useMemo(() => {
    const getWithSWR = id => swr => {
      if (
        !pageSWRs[id] ||
        pageSWRs[id].data !== swr.data ||
        pageSWRs[id].error !== swr.error ||
        pageSWRs[id].revalidate !== swr.revalidate
      ) {
        setPageSWRs(swrs => {
          const _swrs = [...swrs]
          _swrs[id] = swr
          return _swrs
        })
        if (swr.data) {
          // set next page's offset
          const newPageOffset = swrDataToOffset(swr.data)
          if (pageOffsets[id + 1] !== newPageOffset) {
            setPageOffsets(arr => {
              const _arr = [...arr]
              _arr[id + 1] = newPageOffset
              cacheSet(pageOffsetKey, _arr)
              return _arr
            })
          }
        }
      }
      return swr
    }

    // render each page
    const p = []
    const pageCache = pageCacheRef.current
    for (let i = 0; i < pageCount; ++i) {
      if (
        !pageCache[i] ||
        pageCache[i].offset !== pageOffsets[i] ||
        pageCache[i].pageFn !== pageFn
      ) {
        // when props change or at init
        // render the page and cache it
        pageCache[i] = {
          component: (
            <Page
              key={`page-${pageOffsets[i]}`}
              offset={pageOffsets[i]}
              withSWR={getWithSWR(i)}
            />
          ),
          pageFn,
          offset: pageOffsets[i]
        }
      }
      p.push(pageCache[i].component)
    }
    return p
  }, [pageFn, pageCount, pageSWRs, pageOffsets, ...deps])

  return {
    pages,
    pageCount,
    pageSWRs,
    isLoadingMore,
    isReachingEnd,
    isEmpty,
    loadMore
  }
}
