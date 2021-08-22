import hash from './hash'
import { isFunction } from './helper'

import { Key } from '../types'

export function serialize(key: Key): [string, any, string, string] {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  let args
  if (Array.isArray(key)) {
    // args array
    args = key
    key = hash(key)
  } else {
    // Convert falsy values to ''.
    key = String(key || '')
    // The only argument is the key.
    args = [key]
  }

  const errorKey = key ? '$err$' + key : ''
  const isValidatingKey = key ? '$req$' + key : ''

  return [key, args, errorKey, isValidatingKey]
}
