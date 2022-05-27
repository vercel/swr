import React, { useRef, useMemo, memo } from 'react'
import useSWR, { unstable_serialize } from 'swr'
import {
  createCacheHelper,
  SWRHook,
  Middleware,
  withMiddleware,
  isUndefined,
  useIsomorphicLayoutEffect,
  mergeObjects,
  MutatorOptions,
  MutatorCallback,
  Arguments,
  RevalidatorOptions,
  SWRGlobalState,
  getTimestamp,
  GlobalState,
  BareFetcher,
  defaultConfig
} from 'swr/_internal'

import type {
  SWRItemProps,
  SWRAggregatorConfiguration,
  SWRAggregator,
  SWRCollection
} from './types'

const defaultChildren = () => {
  return null
}

export const aggregator = (<Data, Error, Key extends Arguments = Arguments>(
    useSWRNext: SWRHook
  ) =>
  (
    _keys: Key[],
    fetcher: BareFetcher<Data>,
    config: typeof defaultConfig & SWRAggregatorConfiguration<Data, Error, Key>
  ) => {
    if (!Array.isArray(_keys)) throw new Error('not array')
    const { cache, compare, mutate: _internalMutate } = config
    const fetcherRef = useRef(fetcher)
    const configRef = useRef(config)
    const swrkeys = unstable_serialize(_keys)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const keys = useMemo(() => _keys.map(v => unstable_serialize(v)), [swrkeys])
    const cacheHelpers = useMemo(
      () =>
        keys.map(key => {
          const [get] = createCacheHelper<Data>(cache, key)
          return {
            get
          }
        }),
      [keys, cache]
    )
    const fetch = async (revalidateOpts?: RevalidatorOptions): Promise<any> => {
      const revalidate = async (index: number) => {
        let newData: Data
        let startAt: number
        const opts = revalidateOpts || {}
        const key = keys[index]
        const _key = _keys[index]
        const { get } = cacheHelpers[index]
        const [_, MUTATION, FETCH] = SWRGlobalState.get(cache) as GlobalState
        // If there is no ongoing concurrent request, or `dedupe` is not set, a
        // new request should be initiated.
        const shouldStartNewRequest = !FETCH[key] || !opts.dedupe

        const cleanupState = () => {
          // Check if it's still the same request before deleting.
          const requestInfo = FETCH[key]
          if (requestInfo && requestInfo[1] === startAt) {
            delete FETCH[key]
          }
        }
        const currentFetcher = fetcherRef.current
        try {
          if (shouldStartNewRequest) {
            FETCH[key] = [currentFetcher(_key), getTimestamp()]
          }
          ;[newData, startAt] = FETCH[key]
          newData = await newData

          if (shouldStartNewRequest) {
            setTimeout(cleanupState, config.dedupingInterval)
          }
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
            return mergeObjects({}, { data: get().data, error: get().error })
          }
          if (!compare(newData, get().data)) {
            await _internalMutate(_key, newData, false)
          }
          // eslint-disable-next-line no-empty
        } catch {
          cleanupState()
        }
        return mergeObjects({}, { data: get().data, error: get().error })
      }
      return Promise.all(keys.map((___, i) => revalidate(i)))
    }
    const swr = useSWRNext(_keys, () => fetch({ dedupe: true }), config)
    const SWRAggregatorItem = useMemo(() => {
      const Component = memo(({ index }: { index: number }) => {
        const item = useSWR(_keys[index], async () => {
          const currentFetcher = fetcherRef.current
          const data = await currentFetcher(_keys[index])
          swr.mutate()
          return data
        })
        const children = configRef.current.children || defaultChildren
        return children(item, swr, index)
      })
      Component.displayName = 'SWRAggregatorItem'
      return Component
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys, swr])
    const item = (key: any, index: number) => (
      <SWRAggregatorItem key={key} index={index} />
    )
    useIsomorphicLayoutEffect(() => {
      fetcherRef.current = fetcher
      configRef.current = config
    })
    return {
      items: keys.map(item),
      mutate: (
        data: Data[] | Promise<Data[]> | MutatorCallback<Data[]> = () =>
          fetch({ dedupe: false }),
        opt: boolean | MutatorOptions<Data[]> = false
      ) => swr.mutate(data, opt),
      get data() {
        return swr.data?.map((v: any, i: number) =>
          mergeObjects(v, {
            key: keys[i],
            originKey: _keys[i]
          })
        )
      },
      get isLoading() {
        return swr.isLoading
      },
      get isValidating() {
        return swr.isValidating
      }
    }
  }) as unknown as Middleware

export default withMiddleware(useSWR, aggregator) as unknown as SWRAggregator

export {
  SWRItemProps,
  SWRAggregatorConfiguration,
  SWRAggregator,
  SWRCollection
}
