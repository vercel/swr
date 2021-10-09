import { serialize } from './serialize'
import { isFunction, UNDEFINED } from './helper'
import { SWRGlobalState, GlobalState } from './global-state'
import { broadcastState } from './broadcast-state'
import { getTimestamp } from './timestamp'

import { Key, Cache, MutatorCallback } from '../types'

export const internalMutate = async <Data>(
  ...args: [
    Cache,
    Key,
    undefined | Data | Promise<Data | undefined> | MutatorCallback<Data>,
    undefined | boolean
  ]
) => {
  const [cache, _key] = args
  // Fallback to `true` if it's not explicitly set to `false`
  const revalidate = args[3] !== false
  let _data = args[2]

  // Serilaize key
  const [key, , keyErr] = serialize(_key)
  if (!key) return

  const [, , MUTATION_TS, MUTATION_END_TS] = SWRGlobalState.get(
    cache
  ) as GlobalState

  // If there is no new data provided, revalidate the key with current state.
  if (args.length < 3) {
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
      // If it throws an error synchronously, we shouldn't update the cache.
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

  // Only update cached data if there's no error. Data can be `undefined` here.
  if (!error) {
    cache.set(key, data)
  }
  // Always update or reset the error.
  cache.set(keyErr, error)

  // Reset the timestamp to mark the mutation has ended.
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
