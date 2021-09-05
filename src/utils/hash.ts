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
  // Arg isn't null or undefined: https://dorey.github.io/JavaScript-Equality-Table
  const constructor = arg != null && arg.constructor

  // Boolean, null, undefined, number, NaN, string, bigint, etc.
  let result: any = constructor === String ? `"${arg}"` : '' + arg

  if (constructor) {
    if (isFunction(arg)) {
      // `function` type, use WeakMap.
      result = table.get(arg)
      if (!result) {
        result = ++counter
        table.set(arg, result)
      }
      result += '~'
    } else {
      // Non-null object.
      if (constructor === Array) {
        // Array.
        result = '$'
        for (const v of arg) {
          result += stableHash(v) + ','
        }
      } else if (constructor === Object) {
        // Object, sort keys.
        result = '#'
        const keys = Object.keys(arg).sort()
        for (const k of keys) {
          if (!isUndefined(arg[k])) {
            result += k + ':' + stableHash(arg[k]) + ','
          }
        }
      }
    }
  }

  return result
}

// hashes an array of objects and returns a string
export function hash(args: any[]): string {
  if (!args.length) return ''
  return 'arg' + stableHash(args)
}
