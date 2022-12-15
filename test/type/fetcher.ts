import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { expectType, truthy } from './utils'
import type { Equal } from '@type-challenges/utils'

export function useDataErrorGeneric() {
  useSWR<{ id: number }>('/api/', () => ({ id: 123 }))
  useSWR<string, any>('/api/', (key: string) => key)
  useSWRInfinite<string[], any>(
    (index, previousPageData) => {
      expectType<Equal<number, typeof index>>(true)
      expectType<Equal<string[] | null, typeof previousPageData>>(true)
      return 'key'
    },
    key => key
  )
  useSWRInfinite<{ id: number }[], any>(
    (index, previousPageData) => {
      expectType<Equal<number, typeof index>>(true)
      expectType<Equal<{ id: number }[] | null, typeof previousPageData>>(true)
      return truthy() ? 'key' : null
    },
    key => key
  )
}

export function useString() {
  useSWR('/api/user', key => {
    expectType<Equal<'/api/user', typeof key>>(true)
    return key
  })

  useSWR(truthy() ? '/api/user' : null, key => {
    expectType<Equal<'/api/user', typeof key>>(true)
    return key
  })

  useSWR(truthy() ? '/api/user' : false, key => {
    expectType<Equal<'/api/user', typeof key>>(true)
    return key
  })
}

export function useRecord() {
  useSWR({ a: '1', b: { c: '3', d: 2 } }, key => {
    expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
      true
    )
    return key
  })

  useSWR(truthy() ? { a: '1', b: { c: '3', d: 2 } } : null, key => {
    expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
      true
    )
    return key
  })

  useSWR(truthy() ? { a: '1', b: { c: '3', d: 2 } } : false, key => {
    expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
      true
    )
    return key
  })
}

export function useTuple() {
  useSWR([{ a: '1', b: { c: '3' } }, [1231, '888']], keys => {
    expectType<
      Equal<[{ a: string; b: { c: string } }, (string | number)[]], typeof keys>
    >(true)
    return keys
  })
  useSWR(truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null, keys => {
    expectType<
      Equal<[{ a: string; b: { c: string } }, (string | number)[]], typeof keys>
    >(true)
    return keys
  })
  useSWR(
    truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : false,
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys
    }
  )
}

export function useReadonlyTuple() {
  useSWR([{ a: '1', b: { c: '3' } }, [1231, '888']] as const, keys => {
    expectType<
      Equal<
        readonly [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ],
        typeof keys
      >
    >(true)
    return keys
  })
  useSWR(
    truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )
  useSWR(
    truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : false,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )
}

export function useReturnString() {
  useSWR(
    () => '/api/user',
    key => {
      expectType<Equal<string, typeof key>>(true)
      return key
    }
  )
  useSWR(
    () => (truthy() ? '/api/user' : null),
    key => {
      expectType<Equal<'/api/user', typeof key>>(true)
      return key
    }
  )

  useSWR(
    () => (truthy() ? '/api/user' : false),
    key => {
      expectType<Equal<'/api/user', typeof key>>(true)
      return key
    }
  )

  useSWRInfinite(
    (index, previousPageData: string) => {
      return `${index}${previousPageData}`
    },
    key => {
      expectType<Equal<string, typeof key>>(true)
      return key
    }
  )

  useSWRInfinite(
    (index, previousPageData: string) => {
      return truthy() ? `${index}${previousPageData}` : null
    },
    key => {
      expectType<Equal<string, typeof key>>(true)
      return key
    }
  )
  useSWRInfinite(
    (index, previousPageData: string) => {
      return truthy() ? `${index}${previousPageData}` : false
    },
    key => {
      expectType<Equal<string, typeof key>>(true)
      return key
    }
  )
}

export function useReturnRecord() {
  useSWR(
    () => ({ a: '1', b: { c: '3', d: 2 } }),
    key => {
      expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
        true
      )
      return key
    }
  )
  useSWR(
    () => (truthy() ? { a: '1', b: { c: '3', d: 2 } } : null),
    key => {
      expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
        true
      )
      return key
    }
  )

  useSWR(
    () => (truthy() ? { a: '1', b: { c: '3', d: 2 } } : false),
    key => {
      expectType<Equal<{ a: string; b: { c: string; d: number } }, typeof key>>(
        true
      )
      return key
    }
  )

  useSWRInfinite(
    index => ({
      index,
      endPoint: '/api'
    }),
    key => {
      expectType<Equal<{ index: number; endPoint: string }, typeof key>>(true)
      return [key]
    }
  )

  useSWRInfinite(
    index =>
      truthy()
        ? {
            index,
            endPoint: '/api'
          }
        : null,
    key => {
      expectType<Equal<{ index: number; endPoint: string }, typeof key>>(true)
      return [key]
    }
  )

  useSWRInfinite(
    index =>
      truthy()
        ? {
            index,
            endPoint: '/api'
          }
        : false,
    key => {
      expectType<Equal<{ index: number; endPoint: string }, typeof key>>(true)
      return [key]
    }
  )
}

export function useReturnTuple() {
  useSWR(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']],
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys
    }
  )
  useSWR(
    () => (truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null),
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys
    }
  )

  useSWR(
    () => (truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : false),
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys
    }
  )

  useSWRInfinite(
    index => [{ a: '1', b: { c: '3', d: index } }, [1231, '888']],
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string; d: number } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys[1]
    }
  )

  useSWRInfinite(
    index =>
      truthy() ? [{ a: '1', b: { c: '3', d: index } }, [1231, '888']] : null,
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string; d: number } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys[1]
    }
  )

  useSWRInfinite(
    index =>
      truthy() ? [{ a: '1', b: { c: '3', d: index } }, [1231, '888']] : false,
    keys => {
      expectType<
        Equal<
          [{ a: string; b: { c: string; d: number } }, (string | number)[]],
          typeof keys
        >
      >(true)
      return keys[1]
    }
  )
}

export function useReturnReadonlyTuple() {
  useSWR(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']] as const,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )
  useSWR(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )

  useSWR(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : false,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )

  useSWRInfinite(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']] as const,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys
    }
  )
  useSWRInfinite(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys[1]
    }
  )

  useSWRInfinite(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : false,
    keys => {
      expectType<
        Equal<
          readonly [
            {
              readonly a: '1'
              readonly b: {
                readonly c: '3'
              }
            },
            readonly [1231, '888']
          ],
          typeof keys
        >
      >(true)
      return keys[1]
    }
  )
}
