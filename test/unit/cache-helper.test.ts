import { createCacheHelper, initCache } from 'swr/_internal'

const newCache = () => {
  const cache = new Map<string, any>()
  initCache(cache)
  return cache
}

describe('createCacheHelper', () => {
  it.each(['toString', 'constructor', 'valueOf', '__proto__'])(
    'should not resolve the inherited key "%s" from the initial cache',
    key => {
      const cache = newCache()
      const [, , , getServerSnapshot] = createCacheHelper(cache, key)
      expect(getServerSnapshot()).toEqual({})
    }
  )

  it('should return the initial value after a client-side update', () => {
    const cache = newCache()
    const [, set, , getServerSnapshot] = createCacheHelper(cache, 'constructor')
    set({ data: 1 })
    expect(getServerSnapshot()).toBeUndefined()
  })
})
