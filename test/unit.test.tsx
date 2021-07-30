import { normalize } from '../src/utils/normalize-args'

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
})
