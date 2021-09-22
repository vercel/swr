import { Broadcaster } from '../types'
import { SWRGlobalState, GlobalState } from './global-state'
import * as revalidateEvents from '../constants/revalidate-events'

export const broadcastState: Broadcaster = (
  cache,
  key,
  data,
  error,
  isValidating,
  revalidate
) => {
  const [EVENT_REVALIDATORS, STATE_UPDATERS] = SWRGlobalState.get(
    cache
  ) as GlobalState
  const revalidators = EVENT_REVALIDATORS[key]
  const updaters = STATE_UPDATERS[key]

  // Always update states of all hooks.
  if (updaters) {
    for (let i = 0; i < updaters.length; ++i) {
      updaters[i](data, error, isValidating)
    }
  }

  // If we also need to revalidate, only do it for the first hook.
  if (revalidate && revalidators && revalidators[0]) {
    return revalidators[0](revalidateEvents.MUTATE_EVENT).then(() =>
      cache.get(key)
    )
  }

  return cache.get(key)
}
