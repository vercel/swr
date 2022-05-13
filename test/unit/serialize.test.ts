import { unstable_serialize } from 'swr'
import { stableHash } from '../../_internal/utils/hash'

describe('SWR - unstable_serialize', () => {
  it('should serialize arguments correctly', async () => {
    expect(unstable_serialize([])).toBe('')
    expect(unstable_serialize(null)).toBe('')
    expect(unstable_serialize('key')).toBe('key')
    expect(unstable_serialize([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])).toBe(
      stableHash([1, { foo: 2, bar: 1 }, ['a', 'b', 'c']])
    )
  })
})
