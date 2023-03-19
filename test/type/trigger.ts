import useSWRMutation from 'swr/mutation'
import useSWR from 'swr'
type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// Test the Equal type
expectType<Equal<number, string>>(false) // should be false

export function useExtraParam() {
  useSWRMutation('/api/user', key => {
    expectType<string>(key)
  })
  useSWRMutation('/api/user', (_, opts) => {
    expectType<Equal<typeof opts, Readonly<{ arg: never }>>>(true)
  })
}

export function useTrigger() {
  const { trigger, reset, data, error } = useSWRMutation(
    '/api/user',
    (_, opts: { arg: number }) => String(opts.arg)
  )

  // The argument of `trigger` should be number or undefined.
  expectType<Equal<Parameters<typeof trigger>[0], number>>(true)
  expectType<Promise<string | undefined>>(trigger(1))

  // Other return values
  expectType<Equal<typeof reset, () => void>>(true)
  expectType<Equal<typeof data, string | undefined>>(true)
  expectType<Equal<typeof error, any>>(true)

  // Should not return some fields.
  type Ret = ReturnType<typeof useSWRMutation>
  expectType<Equal<Omit<Ret, 'mutate' | 'isValidating'>, Ret>>(true)
}

export function useTriggerWithParameter() {
  const { trigger } = useSWRMutation<string, any, string, number>(
    '/api/user',
    (_, opts) => {
      expectType<Equal<typeof opts, Readonly<{ arg: number }>>>(true)
      return String(opts.arg)
    }
  )

  // The argument of `trigger` should be number or undefined.
  expectType<Equal<Parameters<typeof trigger>[0], number>>(true)
  expectType<Promise<string | undefined>>(trigger(1))
}

export function useTestSWRMutation() {
  const { data } = useSWR('key', async () => {
    return ['foo']
  })
  const { trigger } = useSWRMutation(
    'key',
    async (_, { arg }: { arg: 'foo' }) => {
      return arg.toUpperCase()
    }
  )

  const test = () => {
    // @ts-expect-error `arg` should be 'foo'
    trigger()

    // @ts-expect-error `arg` should be 'foo'
    trigger<typeof data>('bar', {
      optimisticData: current => {
        expectType<string[] | undefined>(current)
        return []
      },
      populateCache: (added, current) => {
        expectType<string>(added)
        expectType<typeof data>(current)
        return []
      },
      revalidate: false
    })
  }
  test()
}

export function useTestSWRMutationWithSWRMutate() {
  const { mutate } = useSWR('/some/key', () => {
    return {
      foo: 'bar'
    }
  })
  const { trigger } = useSWRMutation('/some/key', () => {
    return {
      foo: 'foo'
    }
  })
  const test = () => {
    ;async () => {
      mutate(trigger(), {
        optimisticData: {
          foo: 'baz'
        }
      })
    }
  }
  test()
}
