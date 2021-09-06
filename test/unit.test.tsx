import { normalize } from '../src/utils/normalize-args'
import { hash } from '../src/utils/hash'

describe('Unit tests', () => {
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
    expect(hash([])).toEqual('')

    // Primitives
    expect(hash(['key'])).toEqual('arg$"key",')
    expect(hash([1])).toEqual('arg$1,')
    expect(hash(['false'])).toEqual('arg$"false",')
    expect(hash([false])).toEqual('arg$false,')
    expect(hash([true])).toEqual('arg$true,')
    expect(hash([null])).toEqual('arg$null,')
    expect(hash(['null'])).toEqual('arg$"null",')
    expect(hash([undefined])).toEqual('arg$undefined,')
    expect(hash([NaN])).toEqual('arg$NaN,')
    expect(hash([Infinity])).toEqual('arg$Infinity,')
    expect(hash([''])).toEqual('arg$"",')

    // Encodes `"`
    expect(hash(['","', 1])).not.toEqual(hash(['', '', 1]))

    // BigInt
    expect(hash([BigInt(1)])).toEqual('arg$1,')

    // Constructor
    expect(hash([new String('key')])).toEqual('arg$"key",')
    expect(hash([new Number(123)])).toEqual('arg$123,')

    // Date
    const date = new Date()
    expect(hash([date])).toEqual(`arg$${date},`)

    // Regex
    expect(hash([/regex/])).toEqual('arg$/regex/,')

    // Symbol
    expect(hash([Symbol('key')])).toMatch('arg$Symbol(key),')
    const symbol = Symbol('foo')
    expect(hash([symbol])).toMatch(hash([symbol]))

    // Due to serialization, those three are equivalent
    expect(hash([Symbol.for('key')])).toMatch(hash([Symbol.for('key')]))
    expect(hash([Symbol('key')])).toMatch(hash([Symbol('key')]))
    expect(hash([Symbol('key')])).toMatch(hash([Symbol.for('key')]))

    // Unsupported: Set, Map, Buffer...
    // expect(hash[new Set([])])

    // Serializable objects
    expect(hash([{ x: 1 }])).toEqual('arg$#x:1,,')
    expect(hash([{ x: { y: 2 } }])).toEqual('arg$#x:#y:2,,,')
    expect(hash([[]])).toEqual('arg$$,')
    expect(hash([[[]]])).not.toMatch(hash([[], []]))

    // Unserializable objects
    expect(hash([() => {}])).toMatch(/arg\$\d+~,/)
    expect(hash([class {}])).toMatch(/arg\$\d+~,/)
  })

  it('should always generate the same and stable hash', async () => {
    // Multiple arguments
    expect(hash([() => {}, 1, 'key', null, { x: 1 }])).toMatch(
      /arg\$\d+~,1,"key",null,#x:1,,/
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
})
