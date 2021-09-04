import { isFunction, isUndefined } from './helper'

// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap<object, number>()

// counter of the key
let counter = 0

// A stable hash implementation that supports:
// - Fast and ensures unique hash properties
// - Handles unserializable values
// - Handles object key ordering
// - Generates short results
//
// This is not a serialization function, and the result is not guaranteed to be
// parsible. RegExp, Date, Symbol, circular reference and other things are not
// currently supported.
export function stableHash(arg: any): string | undefined {
  const type = typeof arg
  let result: any = ''

  if (arg) {
    if (isFunction(arg)) {
      // `function` type, use WeakMap.
      result = table.get(arg)
      if (!result) {
        result = ++counter
        table.set(arg, result)
      }
      return '$' + result
    } else if (type === 'object') {
      // Non-null object.
      if (Array.isArray(arg)) {
        // Array.
        for (const v of arg) {
          result += stableHash(v) + ','
        }
        return `[${result}]`
      } else {
        // Not array, sort keys.
        const keys = Object.keys(arg).sort()
        for (const k of keys) {
          if (!isUndefined(arg[k])) {
            result += k + ':' + stableHash(arg[k]) + ','
          }
        }
        return `{${result}}`
      }
    }
  }

  // Boolean, null, undefined, number, NaN, string, bigint, etc.
  return type === 'string' ? `"${arg}"` : '' + arg
}

// hashes an array of objects and returns a string
export function hash(args: any[]): string {
  if (!args.length) return ''
  return 'arg$' + stableHash(args)
}
