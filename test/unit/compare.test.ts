/**
 * @jest-environment @edge-runtime/jest-environment
 */
import { compare } from 'swr/_internal'

describe('Default compare', () => {
  it('should compare primitives and plain objects correctly', () => {
    expect(compare(1, 1)).toBe(true)
    expect(compare(1, 2)).toBe(false)
    expect(compare({ a: 1 }, { a: 1 })).toBe(true)
    expect(compare({ a: 1 }, { a: 2 })).toBe(false)
    expect(compare(undefined, undefined)).toBe(true)
    expect(compare(undefined, {})).toBe(false)
  })

  // `dequal/lite` treats Map and Set as plain objects (`{}`), so any two
  // Maps (or Sets) would always be considered equal and no rerender would
  // happen. The full `dequal` build compares their contents.
  it('should compare Map contents instead of treating them as empty objects', () => {
    expect(compare(new Map(), new Map())).toBe(true)
    expect(compare(new Map([['a', 1]]), new Map([['a', 1]]))).toBe(true)

    // These would all wrongly be `true` with `dequal/lite`
    expect(compare(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false)
    expect(compare(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false)
    expect(compare(new Map([['a', 1]]), new Map())).toBe(false)
    expect(
      compare(
        new Map([['a', 1]]),
        new Map<string, number>([
          ['a', 1],
          ['b', 2]
        ])
      )
    ).toBe(false)
  })

  it('should compare Set contents instead of treating them as empty objects', () => {
    expect(compare(new Set(), new Set())).toBe(true)
    expect(compare(new Set([1, 2]), new Set([1, 2]))).toBe(true)
    expect(compare(new Set([1, 2]), new Set([2, 1]))).toBe(true)

    // These would all wrongly be `true` with `dequal/lite`
    expect(compare(new Set([1]), new Set([2]))).toBe(false)
    expect(compare(new Set([1]), new Set())).toBe(false)
    expect(compare(new Set([1]), new Set([1, 2]))).toBe(false)
  })

  it('should compare nested Map and Set values deeply', () => {
    expect(
      compare(new Map([['a', new Set([1])]]), new Map([['a', new Set([1])]]))
    ).toBe(true)
    expect(
      compare(new Map([['a', new Set([1])]]), new Map([['a', new Set([2])]]))
    ).toBe(false)

    // Map/Set nested inside plain objects
    expect(compare({ s: new Set([1]) }, { s: new Set([1]) })).toBe(true)
    expect(compare({ s: new Set([1]) }, { s: new Set([2]) })).toBe(false)
    expect(
      compare({ m: new Map([['a', 1]]) }, { m: new Map([['a', 2]]) })
    ).toBe(false)
  })

  it('should compare typed arrays by content', () => {
    expect(compare(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true)
    expect(compare(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false)
  })
})
