import { serialize } from './serialize'
import { createCacheHelper } from './helper'
import {
  isFunction,
  isUndefined,
  UNDEFINED,
  mergeObjects,
  isPromiseLike
} from './shared'
import { SWRGlobalState } from './global-state'
import { getTimestamp } from './timestamp'
import * as revalidateEvents from '../events'
import type {
  Cache,
  MutatorCallback,
  MutatorOptions,
  GlobalState,
  State,
  Arguments,
  Key
} from '../types'

type KeyFilter = (key?: Arguments) => boolean
type MutateState<Data> = State<Data, any> & {
  // The previously committed data.
  _c?: Data
}

export async function internalMutate<Data>(
  cache: Cache,
  _key: KeyFilter,
  _data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
  _opts?: boolean | MutatorOptions<Data>
): Promise<Array<Data | undefined>>
export async function internalMutate<Data>(
  cache: Cache,
  _key: Arguments,
  _data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
  _opts?: boolean | MutatorOptions<Data>
): Promise<Data | undefined>
export async function internalMutate<Data>(
  ...args: [
    cache: Cache,
    _key: KeyFilter | Arguments,
    _data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
    _opts?: boolean | MutatorOptions<Data>
  ]
): Promise<any> {
  const [cache, _key, _data, _opts] = args

  // When passing as a boolean, it's explicitly used to disable/enable
  // revalidation.
  const options = mergeObjects(
    { populateCache: true, throwOnError: true },
    typeof _opts === 'boolean' ? { revalidate: _opts } : _opts || {}
  )

  let populateCache = options.populateCache

  const rollbackOnErrorOption = options.rollbackOnError
  let optimisticData = options.optimisticData

  const revalidate = options.revalidate !== false
  const rollbackOnError = (error: unknown): boolean => {
    return typeof rollbackOnErrorOption === 'function'
      ? rollbackOnErrorOption(error)
      : rollbackOnErrorOption !== false
  }
  const throwOnError = options.throwOnError

  // If the second argument is a key filter, return the mutation results for all
  // filtered keys.
  if (isFunction(_key)) {
    const keyFilter = _key
    const matchedKeys: Key[] = []
    const it = cache.keys()
    for (const key of it) {
      if (
        // Skip the special useSWRInfinite and useSWRSubscription keys.
        !/^\$(inf|sub)\$/.test(key) &&
        keyFilter((cache.get(key) as { _k: Arguments })._k)
      ) {
        matchedKeys.push(key)
      }
    }
    return Promise.all(matchedKeys.map(mutateByKey))
  }

  return mutateByKey(_key)

  async function mutateByKey(_k: Key): Promise<Data | undefined> {
    // Serialize key
    const [key] = serialize(_k)
    if (!key) return
    const [get, set] = createCacheHelper<Data, MutateState<Data>>(cache, key)
    const [EVENT_REVALIDATORS, MUTATION, FETCH, PRELOAD] = SWRGlobalState.get(
      cache
    ) as GlobalState

    const startRevalidate = () => {
      const revalidators = EVENT_REVALIDATORS[key]
      if (revalidate) {
        // Invalidate the key by deleting the concurrent request markers so new
        // requests will not be deduped.
        delete FETCH[key]
        delete PRELOAD[key]
        if (revalidators && revalidators[0]) {
          return revalidators[0](revalidateEvents.MUTATE_EVENT).then(
            () => get().data
          )
        }
      }
      return get().data
    }

    // If there is no new data provided, revalidate the key with current state.
    if (args.length < 3) {
      // Revalidate and broadcast state.
      return startRevalidate()
    }

    let data: any = _data
    let error: unknown

    // Update global timestamps.
    const beforeMutationTs = getTimestamp()
    MUTATION[key] = [beforeMutationTs, 0]

    const hasOptimisticData = !isUndefined(optimisticData)
    const state = get()

    // `displayedData` is the current value on screen. It could be the optimistic value
    // that is going to be overridden by a `committedData`, or get reverted back.
    // `committedData` is the validated value that comes from a fetch or mutation.
    const displayedData = state.data
    const currentData = state._c
    const committedData = isUndefined(currentData) ? displayedData : currentData

    // Do optimistic data update.
    if (hasOptimisticData) {
      optimisticData = isFunction(optimisticData)
        ? optimisticData(committedData, displayedData)
        : optimisticData

      // When we set optimistic data, backup the current committedData data in `_c`.
      set({ data: optimisticData, _c: committedData })
    }

    if (isFunction(data)) {
      // `data` is a function, call it passing current cache value.
      try {
        data = (data as MutatorCallback<Data>)(committedData)
      } catch (err) {
        // If it throws an error synchronously, we shouldn't update the cache.
        error = err
      }
    }

    // `data` is a promise/thenable, resolve the final data first.
    if (data && isPromiseLike(data)) {
      // This means that the mutation is async, we need to check timestamps to
      // avoid race conditions.
      data = await (data as Promise<Data>).catch(err => {
        error = err
      })

      // Check if other mutations have occurred since we've started this mutation.
      // If there's a race we don't update cache or broadcast the change,
      // just return the data.
      if (beforeMutationTs !== MUTATION[key][0]) {
        if (error) throw error
        return data
      } else if (error && hasOptimisticData && rollbackOnError(error)) {
        // Rollback. Always populate the cache in this case but without
        // transforming the data.
        populateCache = true
        data = committedData

        // Reset data to be the latest committed data, and clear the `_c` value.
        set({ data, _c: UNDEFINED })
      }
    }

    // If we should write back the cache after request.
    if (populateCache) {
      if (!error) {
        // Transform the result into data.
        if (isFunction(populateCache)) {
          data = populateCache(data, committedData)
        }

        // Only update cached data and reset the error if there's no error. Data can be `undefined` here.
        set({ data, error: UNDEFINED, _c: UNDEFINED })
      }
    }

    // Reset the timestamp to mark the mutation has ended.
    MUTATION[key][1] = getTimestamp()

    // Update existing SWR Hooks' internal states:
    const res = await startRevalidate()

    // The mutation and revalidation are ended, we can clear it since the data is
    // not an optimistic value anymore.
    set({ _c: UNDEFINED })

    // Throw error or return data
    if (error) {
      if (throwOnError) throw error
      return
    }
    return populateCache ? res : data
  }
}
