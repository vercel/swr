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
// parsible. RegEx, Date, Symbol, circular reference and other things are not
// currently supported.
export function stableHash(arg: any): string | undefined {
  const type = typeof arg
  let result

  // `function` type, use WeakMap.
  if (isFunction(arg)) {
    result = table.get(arg)
    if (!result) {
      result = ++counter
      table.set(arg, result)
    }
    return '$' + result
  }

  if (Array.isArray(arg)) {
    return JSON.stringify(arg, (_, value) =>
      value === arg ? value : stableHash(value)
    )
  }

  // Non-null object
  if (arg && type === 'object') {
    // Not array, sort keys.
    const keys = Object.keys(arg).sort()
    result = '{'
    for (const k of keys) {
      const v = arg[k]
      // Skip `undefined` values.
      if (isUndefined(v)) continue
      result += k + ':' + stableHash(v) + ','
    }
    return result + '}'
  }

  // Other primitives: number, string, boolean, undefined, symbol, bigint, null
  return '' + arg
}

// hashes an array of objects and returns a string
export function hash(args: any[]): string {
  if (!args.length) return ''
  return 'arg$' + stableHash(args)
}
