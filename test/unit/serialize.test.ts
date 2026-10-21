/**
 * @jest-environment @edge-runtime/jest-environment
 */
import { unstable_serialize } from 'swr'
import { stableHash } from 'swr/_internal'

describe('SWR - unstable_serialize', () => {
  it('should serialize arguments correctly', async () => {
    expect(unstable_serialize([])).toBe('')
    expect(unstable_serialize(null)).toBe('')
    expect(unstable_serialize('key')).toBe('key')
    expect(unstable_serialize([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])).toBe(
      stableHash([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])
    )
  })

  it('should distinguish object keys with delimiters', () => {
    expect(unstable_serialize({ a: 1, b: 2 })).not.toBe(
      unstable_serialize({ 'b:2,a': 1 })
    )
  })
})
