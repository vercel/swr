import { serialize } from './serialize'
import { isFunction, isUndefined } from './helper'
import { SWRGlobalState, GlobalState } from './global-state'
import { broadcastState } from './broadcast-state'
import { getTimestamp } from './timestamp'
import { createCacheHelper } from './cache'

import { Key, Cache, MutatorCallback, MutatorOptions } from '../types'

export const internalMutate = async <Data>(
  ...args: [
    Cache,
    Key,
    undefined | Data | Promise<Data | undefined> | MutatorCallback<Data>,
    undefined | boolean | MutatorOptions<Data>
  ]
): Promise<Data | undefined> => {
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

  // Serialize key
  const [key] = serialize(_key)
  if (!key) return

  const [get, set] = createCacheHelper<Data>(cache, key)

  const [, , MUTATION] = SWRGlobalState.get(cache) as GlobalState

  // If there is no new data provided, revalidate the key with current state.
  if (args.length < 3) {
    // Revalidate and broadcast state.
    return broadcastState(cache, key, get(), revalidate, true)
  }

  let data: any = _data
  let error: unknown

  // Update global timestamps.
  const beforeMutationTs = getTimestamp()
  MUTATION[key] = [beforeMutationTs, 0]

  const hasOptimisticData = !isUndefined(optimisticData)
  const originalData = get().data

  // Do optimistic data update.
  if (hasOptimisticData) {
    optimisticData = isFunction(optimisticData)
      ? optimisticData(originalData)
      : optimisticData
    set({ data: optimisticData })
    broadcastState(cache, key, { data: optimisticData })
  }

  if (isFunction(data)) {
    // `data` is a function, call it passing current cache value.
    try {
      data = (data as MutatorCallback<Data>)(originalData)
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
      data = originalData
      set({ data: originalData })
    }
  }

  // If we should write back the cache after request.
  if (populateCache) {
    if (!error) {
      // Transform the result into data.
      if (isFunction(populateCache)) {
        data = populateCache(data, originalData)
      }

      // Only update cached data if there's no error. Data can be `undefined` here.
      set({ data })
    }

    // Always update or reset the error.
    set({ error })
  }

  // Reset the timestamp to mark the mutation has ended.
  MUTATION[key][1] = getTimestamp()

  // Update existing SWR Hooks' internal states:
  const res = await broadcastState(
    cache,
    key,
    {
      data,
      error
    },
    revalidate,
    !!populateCache
  )

  // Throw error or return data
  if (error) throw error
  return populateCache ? res : data
}
