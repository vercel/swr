import { Broadcaster } from '../types'
import { SWRGlobalState } from './global-state'
import * as revalidateEvents from '../constants'
import { createCacheHelper } from './cache'

export const broadcastState: Broadcaster = (
  cache,
  key,
  _,
  revalidate,
  __ = true
) => {
  const stateResult = SWRGlobalState.get(cache)
  if (stateResult) {
    const [EVENT_REVALIDATORS, , , FETCH] = stateResult
    const revalidators = EVENT_REVALIDATORS[key]

    const [get] = createCacheHelper(cache, key)

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
}
