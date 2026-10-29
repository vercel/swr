/**
 * @jest-environment @edge-runtime/jest-environment
 */
import { unstable_serialize } from 'swr'
import { serialize, stableHash } from 'swr/_internal'

describe('SWR - unstable_serialize', () => {
  it.each([
    { name: 'object', key: { a: 1 } },
    { name: 'array', key: ['/users', { id: 7 }] }
  ])('should distinguish $name keys from raw hash strings', ({ key }) => {
    expect(unstable_serialize(key)).not.toBe(
      unstable_serialize(stableHash(key))
    )
  })

  it.each([
    { name: 'object', key: { a: 1 } },
    { name: 'array', key: ['/users', { id: 7 }] }
  ])('should escape strings in the $name hash namespace', ({ key }) => {
    const hashKey = unstable_serialize(key)
    const escapedKey = unstable_serialize(hashKey)
    expect(escapedKey).not.toBe(hashKey)
    expect(unstable_serialize(escapedKey)).not.toBe(escapedKey)
    expect(unstable_serialize(escapedKey)).not.toBe(hashKey)
  })

  it.each(['$swr$', '$swr$s$', '$swr$h$#a:1,', '$swr$s$$swr$h$#a:1,'])(
    'should preserve the original string argument for %s',
    key => {
      const [serializedKey, args] = serialize(key)
      expect(args).toBe(key)
      expect(serializedKey).not.toBe(key)
      expect(serialize(() => key)).toEqual([serializedKey, key])
    }
  )

  it.each([null, undefined, false, '', []] as const)(
    'should keep disabled keys empty: %s',
    key => {
      expect(unstable_serialize(key)).toBe('')
      expect(unstable_serialize(() => key)).toBe('')
    }
  )

  it('should preserve structured arguments and resolve function keys', () => {
    const key = { a: 1 }
    expect(serialize(key)[1]).toBe(key)
    expect(serialize(() => key)).toEqual(serialize(key))
    expect(
      unstable_serialize(() => {
        throw new Error('not ready')
      })
    ).toBe('')
  })

  it('should serialize arguments correctly', async () => {
    expect(unstable_serialize([])).toBe('')
    expect(unstable_serialize(null)).toBe('')
    expect(unstable_serialize('key')).toBe('key')
    expect(unstable_serialize([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])).toBe(
      '$swr$h$' + stableHash([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])
    )
  })
})
