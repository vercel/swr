import { useCallback, useMemo, useRef, useState } from 'react'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js'
import {
  createCacheHelper,
  SWRHook,
  Middleware,
  withMiddleware,
  State,
  isUndefined,
  isEmptyCache,
  StateDependencies,
  useIsomorphicLayoutEffect,
  mergeObjects,
  MutatorOptions,
  MutatorCallback,
  Arguments,
  RevalidatorOptions,
  SWRGlobalState,
  getTimestamp,
  GlobalState
} from 'swr/_internal'
import { SWRListFetcher, SWRListHook, SWRListConfiguration } from './types'




export const list = (<Data, Error, Key extends Arguments = Arguments>(
  useSWRNext: SWRHook
) =>
  (
    _keys: Key[],
    fetcher: SWRListFetcher<Data, Key>,
    config: Omit<typeof SWRConfig.default, 'fetcher'> &
      Omit<SWRListConfiguration<Data, Error>, 'fetcher'>
  ) => {
    if (!Array.isArray(_keys)) throw new Error('not array')
    const {
      cache,
      compare,
      mutate: _internalMutate,
      suspense,
      revalidateOnMount
    } = config
    const fetcherRef = useRef(fetcher)
    const configRef = useRef(config)
    const getConfig = () => configRef.current

    const swrkeys = unstable_serialize(_keys)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const keys = useMemo(() => _keys.map(v => unstable_serialize(v)), [swrkeys])
    const [stateDependencies, setStateDependencies] = useState<StateDependencies[]>(() => (
      keys.map(() => ({}))
    ))

    const cacheHelpers = useMemo(
      () =>
        _keys.map(_key => {
          const key = unstable_serialize(_key)
          const [get, _, subscribeCache] = createCacheHelper<Data>(cache, key)
          return {
            get,
            subscribe: (callback: (...args: any[]) => any) => {
              return subscribeCache(key, () => {
                callback()
              })
            }
          }
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [swrkeys, cache]
    )
    const getSnapshot = useCallback(
      () => cacheHelpers.map(({ get }) => get()),
      [cacheHelpers]
    )
    const selector = (snapshot: State<any, any>[]) => {
      const shouldStartRequest = (() => {
        if (!fetcher) return false
        // If `revalidateOnMount` is set, we take the value directly.
        if (!isUndefined(revalidateOnMount)) return revalidateOnMount
        // If it's paused, we skip revalidation.
        if (getConfig().isPaused()) return false
        if (suspense) return false
        return true
      })()
      if (!shouldStartRequest) return snapshot
      if (isEmptyCache(snapshot)) {
        return snapshot.map(() => ({
          isValidating: true,
          isLoading: true
        }))
      }
      return snapshot
    }
    const isEqual = (prev: State<any, any>[], current: State<any, any>[]) => {
      if (prev.length !== current.length) return false
      let equal = true
      for (let i = 0; i < prev.length; i++) {
        for (const _ in stateDependencies[i]) {
          const t = _ as keyof StateDependencies
          if (!compare(current[i][t], prev[i][t])) {
            equal = false
          }
        }
      }
      return equal
    }
    const cacheResult = useSyncExternalStoreWithSelector<
      State<Data, Error>[],
      State<Data, Error>[]
    >(
      callback => {
        const unSubFns = cacheHelpers.map(({ subscribe }) =>
          subscribe(callback)
        )
        return () => {
          unSubFns.map(v => v())
        }
      },
      getSnapshot,
      getSnapshot,
      selector,
      isEqual
    )
    const fetch = async (revalidateOpts?: RevalidatorOptions): Promise<any> => {
      const currentFetcher = fetcherRef.current
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
        try {
          if (shouldStartNewRequest) {
            console.log('list item fire', _key)
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
    useIsomorphicLayoutEffect(() => {
      fetcherRef.current = fetcher
      configRef.current = config
    })
    useIsomorphicLayoutEffect(() => {
      setStateDependencies(keys.map(() => ({})))
    }, [swrkeys])
    return {
      result: cacheResult.map((item, i) => ({
        mutate: (
          data: Data | Promise<Data> | MutatorCallback<Data> = () =>
            fetcherRef.current(_keys[i]),
          opt?: boolean | MutatorOptions<Data>
        ) => _internalMutate(_keys[i], data, opt),
        originKey: _keys[i],
        key: keys[i],
        get data() {
          if (stateDependencies[i]) {
            stateDependencies[i].data = true
          }
          return item.data
        },
        get error() {
          if (stateDependencies[i]) {
            stateDependencies[i].error = true
          }
          stateDependencies[i].error = true
          return item.error
        },
        get isValidating() {
          if (stateDependencies[i]) {
            stateDependencies[i].isValidating = true
          }
          stateDependencies[i].isValidating = true
          return item.isValidating
        },
        get isLoading() {
          if (stateDependencies[i]) {
            stateDependencies[i].isLoading = true
          }
          stateDependencies[i].isLoading = true
          return item.isLoading
        }
      })),
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

export default withMiddleware(useSWR, list) as unknown as SWRListHook
