import { type CustomHashes } from '..'
import { OBJECT, isNil, isUndefined } from './shared'

// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap<object, number | string>()

// counter of the key
let counter = 0

// A stable hash implementation that supports:
// - Fast and ensures unique hash properties
// - Handles unserializable values
// - Handles object key ordering
// - Generates short results
//
// This is not a serialization function, and the result is not guaranteed to be
// parsable.
export const stableHash = (arg: any, customHashes?: CustomHashes): string => {
  const type = typeof arg
  const constructor = arg && arg.constructor
  const isDate = constructor == Date

  let result: string | number | undefined = undefined
  let isCustomHashed = false
  let arrayIndex: number
  let objectIndex: string

  if (OBJECT(arg) === arg && !isDate && constructor != RegExp) {
    // Object/function, not null/date/regexp. Use WeakMap to store the id first.
    // If it's already hashed, directly return the result.
    result = table.get(arg)
    if (result) return String(result)

    // Store the hash first for circular reference detection before entering the
    // recursive `stableHash` calls.
    // For other objects like set and map, we use this id directly as the hash.
    result = ++counter + '~'
    table.set(arg, result)

    if (constructor == Array) {
      // Array.
      result = '@'
      for (arrayIndex = 0; arrayIndex < arg.length; arrayIndex++) {
        result += stableHash(arg[arrayIndex], customHashes) + ','
      }
      table.set(arg, result)
    }
    if (!isNil(customHashes)) {
      for (const customHash of customHashes) {
        const hashed = customHash(arg)
        if (!isNil(hashed)) {
          result = hashed
          table.set(arg, hashed)
          isCustomHashed = true
        }
      }
    }
    if (!isCustomHashed && constructor == OBJECT) {
      // Object, sort keys.
      result = '#'
      const keys = OBJECT.keys(arg).sort()
      while (!isUndefined((objectIndex = keys.pop() as string))) {
        if (!isUndefined(arg[objectIndex])) {
          result +=
            objectIndex + ':' + stableHash(arg[objectIndex], customHashes) + ','
        }
      }
      table.set(arg, result)
    }
  } else {
    result = isDate
      ? arg.toJSON()
      : type == 'symbol'
      ? arg.toString()
      : type == 'string'
      ? JSON.stringify(arg)
      : '' + arg
  }

  return String(result)
}
