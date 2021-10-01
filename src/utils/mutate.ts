import { serialize } from './serialize'
import { isUndefined, isFunction, UNDEFINED } from './helper'
import { SWRGlobalState, GlobalState } from './global-state'
import { broadcastState } from './broadcast-state'
import { getTimestamp } from './timestamp'

import { Key, Cache, MutatorCallback } from '../types'

export const internalMutate = async <Data>(
  cache: Cache,
  _key: Key,
  _data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
  revalidate = true
) => {
  const [key, , keyErr] = serialize(_key)
  if (!key) return

  const [, , MUTATION_TS, MUTATION_END_TS] = SWRGlobalState.get(
    cache
  ) as GlobalState

  // If there is no new data to update, we revalidate the key.
  if (isUndefined(_data)) {
    // Revalidate and broadcast state.
    return broadcastState(
      cache,
      key,
      cache.get(key),
      cache.get(keyErr),
      UNDEFINED,
      revalidate
    )
  }

  let data: any, error: unknown

  // Update global timestamps.
  const beforeMutationTs = (MUTATION_TS[key] = getTimestamp())
  MUTATION_END_TS[key] = 0

  if (isFunction(_data)) {
    // `_data` is a function, call it passing current cache value.
    try {
      _data = (_data as MutatorCallback<Data>)(cache.get(key))
    } catch (err) {
      // if `_data` function throws an error synchronously, it shouldn't be cached
      _data = UNDEFINED
      error = err
    }
  }

  // `_data` is a promise/thenable, resolve the final data first.
  if (_data && isFunction((_data as Promise<Data>).then)) {
    // This means that the mutation is async, we need to check timestamps to
    // avoid race conditions.
    data = await (_data as Promise<Data>).catch(err => {
      error = err
    })

    // Check if other mutations have occurred since we've started this mutation.
    // If there's a race we don't update cache or broadcast the change,
    // just return the data.
    if (beforeMutationTs !== MUTATION_TS[key]) {
      if (error) throw error
      return data
    }
  } else {
    data = _data
  }

  if (!isUndefined(data)) {
    // update cached data
    cache.set(key, data)
  }
  // Always update or reset the error.
  cache.set(keyErr, error)

  // Reset the timestamp to mark the mutation has ended
  MUTATION_END_TS[key] = getTimestamp()

  // Update existing SWR Hooks' internal states:
  const res = await broadcastState(
    cache,
    key,
    data,
    error,
    UNDEFINED,
    revalidate
  )

  // Throw error or return data
  if (error) throw error
  return res
}
