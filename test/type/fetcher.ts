import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'

type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

const truthy: () => boolean = () => true

export function useString() {
  useSWR('/api/user', key => {
    expectType<string>(key)
    return key
  })
  useSWR(truthy() ? '/api/user' : null, key => {
    expectType<string>(key)
    return key
  })
}

export function useRecord() {
  useSWR({ a: '1', b: { c: '3', d: 2 } }, key => {
    expectType<{ a: string; b: { c: string; d: number } }>(key)
    return key
  })
  useSWR(truthy() ? { a: '1', b: { c: '3', d: 2 } } : null, key => {
    expectType<{ a: string; b: { c: string; d: number } }>(key)
    return key
  })
}

export function useTuple() {
  useSWR([{ a: '1', b: { c: '3' } }, [1231, '888']], (...keys) => {
    expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
    return keys
  })
  useSWR(
    truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null,
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys
    }
  )
}

export function useReadonlyTuple() {
  useSWR([{ a: '1', b: { c: '3' } }, [1231, '888']] as const, (...keys) => {
    expectType<
      [
        {
          readonly a: '1'
          readonly b: {
            readonly c: '3'
          }
        },
        readonly [1231, '888']
      ]
    >(keys)
    return keys
  })
  useSWR(
    truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    (...keys) => {
      expectType<
        [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ]
      >(keys)
      return keys
    }
  )
}

export function useReturnString() {
  useSWR(
    () => '/api/user',
    key => {
      expectType<string>(key)
      return key
    }
  )
  useSWR(
    () => (truthy() ? '/api/user' : null),
    key => {
      expectType<string>(key)
      return key
    }
  )

  useSWRInfinite(
    (index, previousPageData: string) => {
      return `${index}${previousPageData}`
    },
    key => {
      expectType<string>(key)
      return key
    }
  )

  useSWRInfinite(
    (index, previousPageData: string) => {
      return truthy() ? `${index}${previousPageData}` : null
    },
    key => {
      expectType<string>(key)
      return key
    }
  )
}

export function useReturnRecord() {
  useSWR(
    () => ({ a: '1', b: { c: '3', d: 2 } }),
    key => {
      expectType<{ a: string; b: { c: string; d: number } }>(key)
      return key
    }
  )
  useSWR(
    () => (truthy() ? { a: '1', b: { c: '3', d: 2 } } : null),
    key => {
      expectType<{ a: string; b: { c: string; d: number } }>(key)
      return key
    }
  )

  useSWRInfinite(
    index => ({
      index,
      endPoint: '/api'
    }),
    key => {
      expectType<{ index: number; endPoint: string }>(key)
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
      expectType<{ index: number; endPoint: string }>(key)
      return [key]
    }
  )
}

export function useReturnTuple() {
  useSWR(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']],
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys
    }
  )
  useSWR(
    () => (truthy() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null),
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys
    }
  )

  useSWRInfinite(
    index => [{ a: '1', b: { c: '3', d: index } }, [1231, '888']],
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys[1]
    }
  )

  useSWRInfinite(
    index =>
      truthy() ? [{ a: '1', b: { c: '3', d: index } }, [1231, '888']] : null,
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys[1]
    }
  )
}

export function useReturnReadonlyTuple() {
  useSWR(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']] as const,
    (...keys) => {
      expectType<
        [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ]
      >(keys)
      return keys
    }
  )
  useSWR(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    (...keys) => {
      expectType<
        [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ]
      >(keys)
      return keys
    }
  )

  useSWRInfinite(
    () => [{ a: '1', b: { c: '3' } }, [1231, '888']] as const,
    (...keys) => {
      expectType<
        [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ]
      >(keys)
      return keys
    }
  )
  useSWRInfinite(
    () =>
      truthy() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
    (...keys) => {
      expectType<
        [
          {
            readonly a: '1'
            readonly b: {
              readonly c: '3'
            }
          },
          readonly [1231, '888']
        ]
      >(keys)
      return keys[1]
    }
  )
}
