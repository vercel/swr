import { isFunction } from './helper'

// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap<object, number>()

// counter of the key
let counter = 0

// hashes an array of objects and returns a string
export function hash(args: any[]): string {
  if (!args.length) return ''
  let key = 'arg'
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]

    // Serializable
    // @TODO: need to implement stable serialization
    if (!isFunction(arg)) {
      // need to consider the case that `arg` is a string:
      // "undefined" -> '"undefined"'
      // 123         -> '123'
      // "null"      -> '"null"'
      // null        -> 'null'
      key += '$' + JSON.stringify(arg)
    } else {
      let id = table.get(arg)
      if (!id) {
        id = ++counter
        table.set(arg, id)
      }
      key += '$_' + table.get(arg)
    }
  }
  return key
}
