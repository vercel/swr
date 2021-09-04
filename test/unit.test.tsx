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
    // Primitives
    expect(hash(['key'])).toEqual('arg$["key"]')
    expect(hash([1])).toEqual('arg$[1]')
    expect(hash([false])).toEqual('arg$[false]')
    expect(hash([null])).toEqual('arg$[null]')
    expect(hash(['null'])).toEqual('arg$["null"]')
    expect(hash([undefined])).toEqual('arg$[undefined]')
    expect(hash([NaN])).toEqual('arg$[NaN]')

    // Unsupported: BigInt, Symbol, Set, Map, Buffer...
    // expect(hash([BigInt(1)])).toEqual('arg$1')
    // expect(hash([Symbol('key')])).toEqual('arg$Symbol(key)')

    // Serializable objects
    expect(hash([{ x: 1 }])).toEqual('arg$[{"x":1}]')
    expect(hash([{ x: { y: 2 } }])).toEqual('arg$[{"x":{"y":2}}]')

    // Unserializable objects
    expect(hash([() => {}])).toMatch(/arg\$_\d+/)
    expect(hash([class {}])).toMatch(/arg\$_\d+/)

    // Multiple arguments
  })
})
