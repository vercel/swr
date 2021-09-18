import useSWR from 'swr'
type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

const cond: () => boolean = () => true

export function useString() {
  useSWR('/api/user', key => {
    expectType<string>(key)
    return key
  })
  useSWR(cond() ? '/api/user' : null, key => {
    expectType<string>(key)
    return key
  })
}

export function useRecord() {
  useSWR({ a: '1', b: { c: '3', d: 2 } }, key => {
    expectType<{ a: string; b: { c: string; d: number } }>(key)
    return key
  })
  useSWR(cond() ? { a: '1', b: { c: '3', d: 2 } } : null, key => {
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
    cond() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null,
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
    cond() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
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
    () => (cond() ? '/api/user' : null),
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
    () => (cond() ? { a: '1', b: { c: '3', d: 2 } } : null),
    key => {
      expectType<{ a: string; b: { c: string; d: number } }>(key)
      return key
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
    () => (cond() ? [{ a: '1', b: { c: '3' } }, [1231, '888']] : null),
    (...keys) => {
      expectType<[{ a: string; b: { c: string } }, (string | number)[]]>(keys)
      return keys
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
      cond() ? ([{ a: '1', b: { c: '3' } }, [1231, '888']] as const) : null,
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
