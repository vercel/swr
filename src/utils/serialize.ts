import { stableHash } from './hash'
import { isFunction } from './helper'

import { Key } from '../types'

export const serialize = (key: Key): [string, Key] => {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  // Use the original key as the argument of fether. This can be a stirng or an
  // array of values.
  const args = key

  // If key is not falsy, or not an empty array, hash it.
  key =
    typeof key == 'string'
      ? key
      : (Array.isArray(key) ? key.length : key)
      ? stableHash(key)
      : ''

  return [key, args]
}
