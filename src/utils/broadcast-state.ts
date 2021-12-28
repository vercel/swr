import { Broadcaster } from '../types'
import { SWRGlobalState, GlobalState } from './global-state'
import * as revalidateEvents from '../constants/revalidate-events'

export const broadcastState: Broadcaster = (
  cache,
  key,
  data,
  error,
  isValidating,
  revalidate,
  broadcast = true
) => {
  const [EVENT_REVALIDATORS, STATE_UPDATERS, , CONCURRENT_REQUESTS] =
    SWRGlobalState.get(cache) as GlobalState
  const revalidators = EVENT_REVALIDATORS[key]
  const updaters = STATE_UPDATERS[key]

  // Cache was populated, update states of all hooks.
  if (broadcast && updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](data, error, isValidating)
    }
  }

  // If we also need to revalidate, only do it for the first hook.
  if (revalidate) {
    // Invalidate the key by deleting the concurrent request markers so new
    // requests will not be deduped.
    delete CONCURRENT_REQUESTS[key]

    if (revalidators && revalidators[0]) {
      return revalidators[0](revalidateEvents.MUTATE_EVENT).then(() =>
        cache.get(key)
      )
    }
  }

  return cache.get(key)
}
