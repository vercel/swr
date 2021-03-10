/**
 * deep equal lite version from dequal
 * https://github.com/lukeed/dequal/blob/master/license
 */

const has = Object.prototype.hasOwnProperty

export default function deepEqual(foo: any, bar: any) {
  let ctor, len
  if (foo === bar) return true

  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
    if (ctor === Date) return foo.getTime() === bar.getTime()
    if (ctor === RegExp) return foo.toString() === bar.toString()

    if (ctor === Array) {
      if ((len = foo.length) === bar.length) {
        while (len && deepEqual(foo[len], bar[len])) {
          len--
        }
      }
      return len === -1
    }

    if (!ctor || typeof foo === 'object') {
      len = 0
      for (ctor in foo) {
        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false
        if (!(ctor in bar) || !deepEqual(foo[ctor], bar[ctor])) return false
      }
      return Object.keys(bar).length === len
    }
  }

  return foo !== foo && bar !== bar
}
