import useSWRMutation from 'swr/mutation'

type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false

export function useExtraParam() {
  useSWRMutation('/api/user', key => {
    expectType<string>(key)
  })
  useSWRMutation('/api/user', (_, opts) => {
    expectType<Equal<typeof opts, Readonly<{ arg: any }>>>(true)
  })
}

export function useTrigger() {
  const { trigger, reset, data, error } = useSWRMutation(
    '/api/user',
    (_, opts: { arg: number }) => String(opts.arg)
  )

  // The argument of trigger should be number or undefined.
  // TODO: handle the `undefined` cases.
  expectType<Equal<Parameters<typeof trigger>[0], number | undefined>>(true)
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

  // The argument of trigger should be number or undefined.
  // TODO: handle the `undefined` cases.
  expectType<Equal<Parameters<typeof trigger>[0], number | undefined>>(true)
  expectType<Promise<string | undefined>>(trigger(1))
}
