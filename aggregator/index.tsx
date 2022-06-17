import React, { useRef, useMemo, useCallback } from 'react'
import useSWR, { unstable_serialize } from 'swr'
import {
  createCacheHelper,
  SWRHook,
  Middleware,
  withMiddleware,
  isUndefined,
  useIsomorphicLayoutEffect,
  mergeObjects,
  Arguments,
  SWRGlobalState,
  getTimestamp,
  GlobalState,
  BareFetcher,
  defaultConfig,
  SWRResponse
} from 'swr/_internal'

import type {
  SWRAggregatorConfiguration,
  SWRAggregator,
  SWRArray
} from './types'

const defaultChildren = () => {
  return null
}
interface Props<Key extends Arguments, Data = any> {
  _key: Key
  fetcherRef: React.RefObject<BareFetcher<Data>>
  children?: (
    value: SWRResponse<Data, Error>,
    index: number
  ) => React.ReactElement<any, any> | null
  index: number
}
const SWRAggregatorItem = <Key extends Arguments, Data = any>({
  _key,
  index,
  fetcherRef,
  children = defaultChildren
}: Props<Key, Data>) => {
  const item = useSWR(_key, async (key: any) => {
    const currentFetcher = fetcherRef.current
    if (!currentFetcher) {
      throw new Error('No fetcher found')
    }
    const data = await currentFetcher(key)
    return data
  })
  return children(item, index)
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
    const fetcherRef = useRef(fetcher)
    const configRef = useRef(config)
    const swrkeys = unstable_serialize(_keys)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const keys = useMemo(() => _keys.map(v => unstable_serialize(v)), [swrkeys])
    const lazyFetcher = useCallback(async (): Promise<any> => {
      const {
        cache,
        compare,
        mutate: _internalMutate,
        dedupingInterval
      } = configRef.current
      const revalidate = async (index: number) => {
        let newData: Data
        let startAt: number
        const key = keys[index]
        const _key = _keys[index]
        const [get] = createCacheHelper<Data>(cache, key)
        const [_, MUTATION, FETCH] = SWRGlobalState.get(cache) as GlobalState
        // If there is no ongoing concurrent request, or `dedupe` is not set, a
        // new request should be initiated.
        const shouldStartNewRequest = !FETCH[key]

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
            setTimeout(cleanupState, dedupingInterval)
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys])
    const swr = useSWRNext(_keys, lazyFetcher, config)
    const result = {
      mutate: swr.mutate,
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
    const item = (key: string, index: number) => (
      <SWRAggregatorItem
        key={key}
        _key={_keys[index]}
        index={index}
        fetcherRef={fetcherRef}
      >
        {(v: SWRResponse<Data>, i: number) => config.children(v, i, result)}
      </SWRAggregatorItem>
    )

    useIsomorphicLayoutEffect(() => {
      fetcherRef.current = fetcher
      configRef.current = config
    })
    return Object.assign(result, { items: keys.map(item) })
  }) as unknown as Middleware

export default withMiddleware(useSWR, aggregator) as unknown as SWRAggregator

export { SWRAggregatorConfiguration, SWRAggregator, SWRArray }
