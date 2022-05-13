import { Cache, GlobalState } from '../types'

// Global state used to deduplicate requests and store listeners
export const SWRGlobalState = new WeakMap<Cache, GlobalState>()
