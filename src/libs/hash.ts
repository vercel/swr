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
    let _hash
    if (args[i] === null || (typeof args[i] !== 'object' && typeof args[i] !== 'function')) {
      // need to consider the case that args[i] is a string:
      // args[i]        _hash
      // "undefined" -> '"undefined"'
      // undefined   -> 'undefined'
      // 123         -> '123'
      // null        -> 'null'
      // "null"      -> '"null"'
      if (typeof args[i] === 'string') {
        _hash = '"' + args[i] + '"'
      } else {
        _hash = String(args[i])
      }
    } else {
      if (!table.has(args[i])) {
        _hash = counter
        table.set(args[i], counter++)
      } else {
        _hash = table.get(args[i])
      }
    }
    key += '@' + _hash
  }
  return key
}
