import type { SWRInfiniteKeyLoader } from './types'
import { serialize } from 'swr/_internal'

export const INFINITE_PREFIX = '$inf$'

export const getFirstPageKey = (getKey: SWRInfiniteKeyLoader) => {
  return serialize(getKey ? getKey(0, null) : null)[0]
}

export const unstable_serialize = (getKey: SWRInfiniteKeyLoader) => {
  return INFINITE_PREFIX + getFirstPageKey(getKey)
}
