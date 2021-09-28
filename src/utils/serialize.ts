import { stableHash } from './hash'
import { isFunction } from './helper'

import { Key } from '../types'

export const serialize = (key: Key): [string, any[], string, string] => {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  const args = [].concat(key as any)

  // If key is not falsy, or not an empty array, hash it.
  key =
    typeof key == 'string'
      ? key
      : (Array.isArray(key)
        ? key.length
        : key)
      ? stableHash(key)
      : ''

  const errorKey = key ? '$err$' + key : ''
  const isValidatingKey = key ? '$req$' + key : ''

  return [key, args, errorKey, isValidatingKey]
}
