import { isFunction, UNDEFINED } from './helper'

// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap()

// counter of the key
let counter = 0

// hashes an array of objects and returns a string
export default function hash(args: any[]): string {
  if (!args.length) return ''
  let key = 'arg'
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]

    let _hash: any = UNDEFINED
    if (arg === null || (typeof arg !== 'object' && !isFunction(arg))) {
      // need to consider the case that `arg` is a string:
      // "undefined" -> '"undefined"'
      // 123         -> '123'
      // "null"      -> '"null"'
      // null        -> 'null'
      _hash = JSON.stringify(arg)
    } else {
      if (!table.has(arg)) {
        _hash = counter
        table.set(arg, counter++)
      } else {
        _hash = table.get(arg)
      }
    }
    key += '$' + _hash
  }
  return key
}
