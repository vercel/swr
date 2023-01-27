import React, { useRef, useMemo, useCallback } from 'react'
import useSWR, { unstable_serialize } from 'swr'
import {
  preload,
  withMiddleware,
  useIsomorphicLayoutEffect,
  mergeObjects
} from 'swr/_internal'

import type {
  SWRHook,
  Middleware,
  Arguments,
  GlobalState,
  BareFetcher,
  SWRResponse,
  defaultConfig
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
      const revalidate = async (index: number) => {
        const key = keys[index]
        const currentFetcher = fetcherRef.current
        return preload(key, currentFetcher)
      }
      return Promise.all(keys.map((___, i) => revalidate(i)))
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
