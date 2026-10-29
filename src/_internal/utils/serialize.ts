import { stableHash } from './hash'
import { isFunction } from './shared'

import type { Key, Arguments } from '../types'

export const serialize = (key: Key): [string, Arguments] => {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  // Use the original key as the argument of fetcher. This can be a string or an
  // array of values.
  const args = key

  // Reserve separate namespaces for hashes and strings that use the prefix.
  // Ordinary string keys stay unchanged, including the empty key.
  key =
    typeof key == 'string'
      ? key.startsWith('$swr$')
        ? '$swr$s$' + key
        : key
      : (Array.isArray(key) ? key.length : key)
        ? '$swr$h$' + stableHash(key)
        : ''

  return [key, args]
}
