import useSWRSubscription from 'swr/subscription'
import type { SWRSubscriptionOptions, SWRSubscription } from 'swr/subscription'
import { expectType, truthy } from './utils'

export function useTestSubscription() {
  useSWRSubscription(
    'key',
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<'key'>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    truthy() ? 'key' : undefined,
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<'key'>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    ['key', 1],
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<[string, number]>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    truthy() ? ['key', 1] : undefined,
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<[string, number]>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    { foo: 'bar' },
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<{ foo: string }>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    truthy() ? { foo: 'bar' } : undefined,
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<{ foo: string }>(key)
      return () => {}
    }
  )

  useSWRSubscription(
    () => 'key',
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<string>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    () => (truthy() ? 'key' : undefined),
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<'key'>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    () => ['key', 1],
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<[string, number]>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    () => (truthy() ? ['key', 1] : undefined),
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<[string, number]>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    () => ({ foo: 'bar' }),
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<{ foo: string }>(key)
      return () => {}
    }
  )
  useSWRSubscription(
    () => (truthy() ? { foo: 'bar' } : undefined),
    (key, { next: _ }: SWRSubscriptionOptions<string, Error>) => {
      expectType<{ foo: string }>(key)
      return () => {}
    }
  )

  const sub: SWRSubscription<string, string, Error> = (_, { next: __ }) => {
    return () => {}
  }
  const { data: data2, error: error2 } = useSWRSubscription('key', sub)
  expectType<string | undefined>(data2)
  expectType<Error | undefined>(error2)
}
