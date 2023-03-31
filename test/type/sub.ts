import useSWRSubscription from 'swr/subscription'
import type { SWRSubNext, SWRSubscription } from 'swr/subscription'
import { expectType } from './utils'

export function useTestSubscription<T>() {
  const { data, error } = useSWRSubscription(
    'key',
    (key, { next: _ }: SWRSubNext<string, Error>) => {
      expectType<'key'>(key)
      return () => {}
    }
  )
  expectType<string | undefined>(data)
  expectType<Error | undefined>(error)

  const sub: SWRSubscription<string, T, Error> = (_, { next: __ }) => {
    return () => {}
  }
  const { data: data2, error: error2 } = useSWRSubscription('key', sub)
  expectType<T | undefined>(data2)
  expectType<Error | undefined>(error2)
}
