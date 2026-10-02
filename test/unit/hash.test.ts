import { stableHash } from 'swr/_internal'

describe('SWR - stableHash', () => {
  describe('object key ordering', () => {
    it('should hash the same keys in a different order identically', () => {
      expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }))
    })

    it('should hash nested keys in a different order identically', () => {
      expect(stableHash({ x: { a: 1, b: 2 }, y: 3 })).toBe(
        stableHash({ y: 3, x: { b: 2, a: 1 } })
      )
    })

    it('should hash arrays by position, not as an unordered set', () => {
      expect(stableHash([[1], [2]])).not.toBe(stableHash([[2], [1]]))
    })
  })

  describe('undefined values', () => {
    it('should ignore a key whose value is undefined', () => {
      expect(stableHash({ a: 1, b: undefined })).toBe(stableHash({ a: 1 }))
    })

    it('should hash an all-undefined object like an empty one', () => {
      expect(stableHash({ a: undefined })).toBe(stableHash({}))
    })

    it('should keep undefined array items significant', () => {
      expect(stableHash([1, undefined])).not.toBe(stableHash([1]))
    })
  })

  describe('collisions between types', () => {
    it('should not collide a number with its string form', () => {
      expect(stableHash(1)).not.toBe(stableHash('1'))
    })

    it('should not collide an array with a string shaped like its hash', () => {
      expect(stableHash([1, 2])).not.toBe(stableHash('@1,2,'))
    })

    it('should not collide an object with a string shaped like its hash', () => {
      expect(stableHash({ a: 1 })).not.toBe(stableHash('#a:1,'))
    })

    it('should not collide an empty array with an empty object', () => {
      expect(stableHash([])).not.toBe(stableHash({}))
    })
  })

  describe('serialisable values', () => {
    it('should hash equal dates identically and different ones apart', () => {
      expect(stableHash(new Date(0))).toBe(stableHash(new Date(0)))
      expect(stableHash(new Date(0))).not.toBe(stableHash(new Date(1)))
    })

    it('should hash a regular expression by its source and flags', () => {
      expect(stableHash(/x/g)).toBe(stableHash(/x/g))
      expect(stableHash(/x/g)).not.toBe(stableHash(/x/i))
      expect(stableHash(/x/g)).not.toBe(stableHash(/y/g))
    })

    it('should hash a symbol by its description', () => {
      expect(stableHash(Symbol('a'))).toBe(stableHash(Symbol('a')))
      expect(stableHash(Symbol('a'))).not.toBe(stableHash(Symbol('b')))
    })

    it('should hash structurally equal plain objects identically', () => {
      expect(stableHash({ a: 1, b: [2, 3] })).toBe(
        stableHash({ a: 1, b: [2, 3] })
      )
    })
  })

  describe('unserialisable values', () => {
    // Sets, maps and functions cannot be inspected structurally, so they are
    // hashed by reference identity. Two structurally equal instances are
    // therefore *not* interchangeable as part of an SWR key.
    it('should hash the same reference consistently', () => {
      const set = new Set([1])
      expect(stableHash(set)).toBe(stableHash(set))

      const fn = () => {}
      expect(stableHash(fn)).toBe(stableHash(fn))
    })

    it('should hash equal sets by identity rather than contents', () => {
      expect(stableHash(new Set([1]))).not.toBe(stableHash(new Set([1])))
    })

    it('should hash equal maps by identity rather than contents', () => {
      expect(stableHash(new Map([[1, 2]]))).not.toBe(
        stableHash(new Map([[1, 2]]))
      )
    })
  })

  describe('circular references', () => {
    it('should hash a self-referencing object without overflowing', () => {
      const circular: Record<string, unknown> = { a: 1 }
      circular.self = circular

      expect(() => stableHash(circular)).not.toThrow()
      expect(stableHash(circular)).toBe(stableHash(circular))
    })

    it('should hash mutually referencing objects without overflowing', () => {
      const a: Record<string, unknown> = {}
      const b: Record<string, unknown> = { a }
      a.b = b

      expect(() => stableHash(a)).not.toThrow()
      expect(stableHash(a)).toBe(stableHash(a))
    })
  })
})
