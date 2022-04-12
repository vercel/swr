import { Broadcaster } from '../types'
import { SWRGlobalState, GlobalState } from './global-state'
import * as revalidateEvents from '../constants'
import { createCacheHelper } from './cache'

export const broadcastState: Broadcaster = (
  cache,
  key,
  state,
  revalidate,
  broadcast = true
) => {
  const [EVENT_REVALIDATORS, STATE_UPDATERS, , FETCH] = SWRGlobalState.get(
    cache
  ) as GlobalState
  const revalidators = EVENT_REVALIDATORS[key]
  const updaters = STATE_UPDATERS[key]

  const [get] = createCacheHelper(cache, key)

  // Cache was populated, update states of all hooks.
  if (broadcast && updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](state)
    }
  }

  // If we also need to revalidate, only do it for the first hook.
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
