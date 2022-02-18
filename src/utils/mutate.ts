import { serialize } from './serialize'
import { isFunction, isUndefined, mergeObjects, UNDEFINED } from './helper'
import { SWRGlobalState, GlobalState } from './global-state'
import { broadcastState } from './broadcast-state'
import { getTimestamp } from './timestamp'

import { Key, Cache, MutatorCallback, MutatorOptions } from '../types'

export const internalMutate = async <Data>(
  ...args: [
    Cache,
    Key,
    undefined | Data | Promise<Data | undefined> | MutatorCallback<Data>,
    undefined | boolean | MutatorOptions<Data>
  ]
) => {
  const [cache, _key, _data, _opts] = args

  // When passing as a boolean, it's explicitily used to disable/enable
  // revalidation.
  const options =
    typeof _opts === 'boolean' ? { revalidate: _opts } : _opts || {}

  // Fallback to `true` if it's not explicitly set to `false`
  let populateCache = isUndefined(options.populateCache)
    ? true
    : options.populateCache
  const revalidate = options.revalidate !== false
  const rollbackOnError = options.rollbackOnError !== false
  const customOptimisticData = options.optimisticData

  // Serilaize key
  const [key, , keyInfo] = serialize(_key)
  if (!key) return

  const [, , MUTATION] = SWRGlobalState.get(cache) as GlobalState

  // If there is no new data provided, revalidate the key with current state.
  if (args.length < 3) {
    // Revalidate and broadcast state.
    return broadcastState(
      cache,
      key,
      cache.get(key),
      UNDEFINED,
      UNDEFINED,
      revalidate,
      true
    )
  }

  let data: any = _data
  let error: unknown

  // Update global timestamps.
  const beforeMutationTs = getTimestamp()
  MUTATION[key] = [beforeMutationTs, 0]
  const hasCustomOptimisticData = !isUndefined(customOptimisticData)
  const rollbackData = cache.get(key)

  // Do optimistic data update.
  if (hasCustomOptimisticData) {
    const optimisticData = isFunction(customOptimisticData)
      ? customOptimisticData(rollbackData)
      : customOptimisticData
    cache.set(key, optimisticData)
    broadcastState(cache, key, optimisticData)
  }

  if (isFunction(data)) {
    // `data` is a function, call it passing current cache value.
    try {
      data = (data as MutatorCallback<Data>)(cache.get(key))
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
    } else if (error && hasCustomOptimisticData && rollbackOnError) {
      // Rollback. Always populate the cache in this case but without
      // transforming the data.
      populateCache = true
      data = rollbackData
      cache.set(key, rollbackData)
    }
  }

  // If we should write back the cache after request.
  if (populateCache) {
    if (!error) {
      // Transform the result into data.
      if (isFunction(populateCache)) {
        data = populateCache(data, rollbackData)
      }

      // Only update cached data if there's no error. Data can be `undefined` here.
      cache.set(key, data)
    }

    // Always update or reset the error.
    cache.set(keyInfo, mergeObjects(cache.get(keyInfo), { error }))
  }

  // Reset the timestamp to mark the mutation has ended.
  MUTATION[key][1] = getTimestamp()

  // Update existing SWR Hooks' internal states:
  const res = await broadcastState(
    cache,
    key,
    data,
    error,
    UNDEFINED,
    revalidate,
    !!populateCache
  )

  // Throw error or return data
  if (error) throw error
  return populateCache ? res : data
}
