import hash from './hash'
import { Key } from '../types'

export function serialize(key: Key): [string, any, string, string] {
  let args = null
  if (typeof key === 'function') {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  if (Array.isArray(key)) {
    // args array
    args = key
    key = hash(key)
  } else {
    // convert falsy values to ''
    key = String(key || '')
  }

  const errorKey = key ? 'err@' + key : ''
  const isValidatingKey = key ? 'req@' + key : ''

  return [key, args, errorKey, isValidatingKey]
}
