// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap()

// counter of the key
let counter = 0

// hashes an array of objects and returns a string
export default function hash(args: any[]): string {
  let key = 'arg'
  for (let i = 0; i < args.length; ++i) {
    let _hash
    if (typeof args[i] !== 'object') {
      _hash = String(args[i])
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
