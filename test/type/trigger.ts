import useSWRMutation from 'swr/mutation'

type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B
  ? 1
  : 2)
  ? true
  : false

export function useExtraParam() {
  useSWRMutation('/api/user', key => {
    expectType<string>(key)
  })
  useSWRMutation('/api/user', (_, extra) => {
    expectType<Equal<typeof extra, any>>(true)
  })
}

export function useTrigger() {
  const { trigger } = useSWRMutation('/api/user', (_, extra: number) =>
    String(extra)
  )

  // The argument of trigger should be number or undefined.
  // TODO: handle the `undefined` cases.
  expectType<Equal<Parameters<typeof trigger>[0], number | undefined>>(true)
  expectType<Promise<string | undefined>>(trigger(1))
}
