import { normalize } from '../../_internal/utils/normalize-args'
import { stableHash as hash } from '../../_internal/utils/hash'
import { serialize } from '../../_internal/utils/serialize'
import { mergeConfigs } from '../../_internal/utils/merge-config'

describe('Utils', () => {
  it('should normalize arguments correctly', async () => {
    const fetcher = () => {}
    const opts = { revalidateOnFocus: false }

    // Only the `key` argument is passed
    expect(normalize(['key'])).toEqual(['key', null, {}])

    // `key` and `null` as fetcher (no fetcher)
    expect(normalize(['key', null])).toEqual(['key', null, {}])

    // `key` and `fetcher`
    expect(normalize(['key', fetcher])).toEqual(['key', fetcher, {}])

    // `key` and `options`
    expect(normalize(['key', opts])).toEqual(['key', null, opts])

    // `key`, `null` as fetcher, and `options`
    expect(normalize(['key', null, opts])).toEqual(['key', null, opts])

    // `key`, `fetcher`, and `options`
    expect(normalize(['key', fetcher, opts])).toEqual(['key', fetcher, opts])
  })

  it('should hash arguments correctly', async () => {
    // Empty
    expect(serialize([])[0]).toEqual('')

    // Primitives
    expect(hash(['key'])).toEqual('@"key",')
    expect(hash([1])).toEqual('@1,')
    expect(hash(['false'])).toEqual('@"false",')
    expect(hash([false])).toEqual('@false,')
    expect(hash([true])).toEqual('@true,')
    expect(hash([null])).toEqual('@null,')
    expect(hash(['null'])).toEqual('@"null",')
    expect(hash([undefined])).toEqual('@undefined,')
    expect(hash([NaN])).toEqual('@NaN,')
    expect(hash([Infinity])).toEqual('@Infinity,')
    expect(hash([''])).toEqual('@"",')

    // Encodes `"`
    expect(hash(['","', 1])).not.toEqual(hash(['', '', 1]))

    // BigInt
    expect(hash([BigInt(1)])).toEqual('@1,')

    // Date
    const date = new Date()
    expect(hash([date])).toEqual(`@${date.toJSON()},`)
    expect(hash([new Date(1234)])).toEqual(hash([new Date(1234)]))

    // Regex
    expect(hash([/regex/])).toEqual('@/regex/,')

    // Symbol
    expect(hash([Symbol('key')])).toMatch('@Symbol(key),')
    const symbol = Symbol('foo')
    expect(hash([symbol])).toMatch(hash([symbol]))

    // Due to serialization, those three are equivalent
    expect(hash([Symbol.for('key')])).toMatch(hash([Symbol.for('key')]))
    expect(hash([Symbol('key')])).toMatch(hash([Symbol('key')]))
    expect(hash([Symbol('key')])).toMatch(hash([Symbol.for('key')]))

    // Set, Map, Buffer...
    const set = new Set()
    expect(hash([set])).not.toMatch(hash([new Set()]))
    expect(hash([set])).toMatch(hash([set]))
    const map = new Map()
    expect(hash([map])).not.toMatch(hash([new Map()]))
    expect(hash([map])).toMatch(hash([map]))
    const buffer = new ArrayBuffer(0)
    expect(hash([buffer])).not.toMatch(hash([new ArrayBuffer(0)]))
    expect(hash([buffer])).toMatch(hash([buffer]))

    // Serializable objects
    expect(hash([{ x: 1 }])).toEqual('@#x:1,,')
    expect(hash([{ '': 1 }])).toEqual('@#:1,,')
    expect(hash([{ x: { y: 2 } }])).toEqual('@#x:#y:2,,,')
    expect(hash([[]])).toEqual('@@,')
    expect(hash([[[]]])).not.toMatch(hash([[], []]))

    // Circular
    const o: any = {}
    o.o = o
    expect(hash([o])).toEqual(hash([o]))
    expect(hash([o])).not.toEqual(hash([{}]))
    const a: any = []
    a.push(a)
    expect(hash([a])).toEqual(hash([a]))
    expect(hash([a])).not.toEqual(hash([[]]))
    const o2: any = {}
    const a2: any = [o2]
    o2.a = a2
    expect(hash([o2])).toEqual(hash([o2]))

    // Unserializable objects
    expect(hash([() => {}])).toMatch(/@\d+~,/)
    expect(hash([class {}])).toMatch(/@\d+~,/)
  })

  it('should always generate the same and stable hash', async () => {
    // Multiple arguments
    expect(hash([() => {}, 1, 'key', null, { x: 1 }])).toMatch(
      /@\d+~,1,"key",null,#x:1,,/
    )

    // Stable hash
    expect(hash([{ x: 1, y: 2, z: undefined }])).toMatch(
      hash([{ z: undefined, y: 2, x: 1 }])
    )
    expect(hash([{ x: 1, y: { a: 1, b: 2 }, z: undefined }])).toMatch(
      hash([{ y: { b: 2, a: 1 }, x: 1 }])
    )

    // Same hash of the same reference
    const f = () => {}
    expect(hash([f])).toEqual(hash([f]))
    expect(hash([() => {}])).not.toEqual(hash([() => {}]))
  })

  it('should correctly merge configs', async () => {
    const a: any = { a: 1 },
      b: any = { b: 1 }

    // Should merge middleware
    expect(mergeConfigs({ use: [a] }, { use: [b] })).toEqual({ use: [a, b] })

    // Should merge fallback
    expect(mergeConfigs({ fallback: a }, { fallback: b })).toEqual({
      fallback: { a: 1, b: 1 }
    })
  })
})
