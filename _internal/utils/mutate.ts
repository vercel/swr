import { serialize } from './serialize'
import { createCacheHelper, isFunction, isUndefined, UNDEFINED } from './helper'
import { SWRGlobalState } from './global-state'
import { getTimestamp } from './timestamp'
import * as revalidateEvents from '../constants'
import {
  Cache,
  MutatorCallback,
  MutatorOptions,
  GlobalState,
  State,
  Arguments
} from '../types'

type KeyFilter = (key?: string) => boolean

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
  const options =
    typeof _opts === 'boolean' ? { revalidate: _opts } : _opts || {}

  // Fallback to `true` if it's not explicitly set to `false`
  let populateCache = isUndefined(options.populateCache)
    ? true
    : options.populateCache
  let optimisticData = options.optimisticData
  const revalidate = options.revalidate !== false
  const rollbackOnError = options.rollbackOnError !== false

  if (!_key) return

  // If 2nd arg is key filter, return the mutation results of filtered keys
  if (isFunction(_key)) {
    const keyFilter = _key
    const matchedKeys = []
    for (const k of cache.keys()) {
      if (keyFilter(k)) matchedKeys.push(k)
    }
    return await Promise.all(matchedKeys.map(mutateByKey))
  } else {
    const [serializedKey] = serialize(_key)
    return await mutateByKey(serializedKey)
  }

  async function mutateByKey(key: string): Promise<Data | undefined> {
    const [get, set] = createCacheHelper<
      Data,
      State<Data, any> & {
        // The previously committed data.
        _c?: Data
      }
    >(cache, key)
    const [EVENT_REVALIDATORS, MUTATION, FETCH] = SWRGlobalState.get(
      cache
    ) as GlobalState

    const revalidators = EVENT_REVALIDATORS[key]
    const startRevalidate = () => {
      if (revalidate) {
        // Invalidate the key by deleting the concurrent request markers so new
        // requests will not be deduped.
        delete FETCH[key]
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
    const committedData = isUndefined(state._c) ? displayedData : state._c

    // Do optimistic data update.
    if (hasOptimisticData) {
      optimisticData = isFunction(optimisticData)
        ? optimisticData(committedData)
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
    if (data && isFunction((data as Promise<Data>).then)) {
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
      } else if (error && hasOptimisticData && rollbackOnError) {
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

        // Only update cached data if there's no error. Data can be `undefined` here.
        set({ data, _c: UNDEFINED })
      }

      // Always update error and original data here.
      set({ error })
    }

    // Reset the timestamp to mark the mutation has ended.
    MUTATION[key][1] = getTimestamp()

    // Update existing SWR Hooks' internal states:
    const res = await startRevalidate()

    // The mutation and revalidation are ended, we can clear it since the data is
    // not an optimistic value anymore.
    set({ _c: UNDEFINED })

    // Throw error or return data
    if (error) throw error
    return populateCache ? res : data
  }
}
