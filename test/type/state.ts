import useSWR from 'swr'

type ExpectType = <T>(value: T) => void
const expectType: ExpectType = () => {}

export function useInferDataType() {
  // Should infer the data type
  expectType<string | undefined>(useSWR('foo', i => i).data)
  expectType<number | undefined>(useSWR('foo', () => 1).data)
  expectType<{ foo: number } | undefined>(useSWR({ foo: 1 }, i => i).data)
  expectType<{ foo: 1 } | undefined>(useSWR({ foo: 1 } as const, i => i).data)
  expectType<string | undefined>(useSWR(['foo'], i => i[0]).data)

  // Should mark data and error as readonly
  expectType<Readonly<{}> | undefined>(useSWR({}, i => i).data)
  expectType<Readonly<{}> | undefined>(useSWR<any, {}>('').error)
}

export function useInferMutateType() {
  // Should infer the mutate argument type
  useSWR('foo', i => i).mutate(v => {
    expectType<string | undefined>(v)
    return v
  })

  // Should mark it as readonly
  useSWR({ foo: 1 }, i => i).mutate(v => {
    expectType<Readonly<{ foo: number }> | undefined>(v)
    return v
  })
  useSWR({ foo: 1 } as const, i => i).mutate(v => {
    expectType<Readonly<{ foo: 1 }> | undefined>(v)
    return v
  })
}
