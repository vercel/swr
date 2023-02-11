import type { Equal, Expect } from '@type-challenges/utils'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import type {
  MutatorFn,
  Key,
  MutatorCallback,
  Mutator,
  MutatorWrapper,
  Arguments
} from 'swr/_internal'
import { expectType } from './utils'

type Case1<Data = any> = MutatorFn<Data>
type Case2<Data = any> = (
  cache: Cache,
  key: Key,
  data: Data | Promise<Data> | MutatorCallback<Data>,
  opts: boolean
) => Promise<Data | undefined>
type Case3<Data = any> = (
  cache: Cache,
  key: Key,
  data: Data | Promise<Data> | MutatorCallback<Data>
) => Promise<Data | undefined>
type Case4<Data = any> = (
  cache: Cache,
  key: Key,
  data: Data | Promise<Data> | MutatorCallback<Data>,
  opts: {
    populateCache: undefined
  }
) => Promise<Data | undefined>
type Case5<Data = any> = (
  cache: Cache,
  key: Key,
  data: Data | Promise<Data> | MutatorCallback<Data>,
  opts: {
    populateCache: false
  }
) => Promise<Data | undefined>
type Case6<Data = any> = (
  cache: Cache,
  key: Key,
  data: Data | Promise<Data> | MutatorCallback<Data>,
  opts: {
    populateCache: true
  }
) => Promise<Data | undefined>

export type TestCasesForMutator = [
  Expect<Equal<Mutator<{}>, Promise<{} | undefined>>>,
  Expect<Equal<MutatorWrapper<Case1<{}>>, Promise<{} | undefined>>>,
  Expect<Equal<MutatorWrapper<Case2<{}>>, Promise<{} | undefined>>>,
  Expect<Equal<MutatorWrapper<Case3<{}>>, Promise<{} | undefined>>>,
  Expect<Equal<MutatorWrapper<Case4<{}>>, Promise<{} | undefined>>>,
  Expect<Equal<MutatorWrapper<Case5<{}>>, never>>,
  Expect<Equal<MutatorWrapper<Case6<{}>>, Promise<{} | undefined>>>
]

export function useMutatorTypes() {
  const { mutate } = useSWR<string>('')

  mutate(async () => '1')

  // @ts-expect-error
  mutate(async () => 1)

  // FIXME: this should work.
  // mutate(async () => 1, { populateCache: false })
}

export function useConfigMutate() {
  const { mutate } = useSWRConfig()
  expect<Promise<Array<any>>>(
    mutate(
      key => {
        expectType<Arguments>(key)
        return typeof key === 'string' && key.startsWith('swr')
      },
      data => {
        expectType<number | undefined>(data)
        return 0
      }
    )
  )

  expect<Promise<any>>(
    mutate('string', data => {
      expectType<string | undefined>(data)
      return '0'
    })
  )

  expect<Promise<Array<number | undefined>>>(
    mutate<number>(
      key => {
        expectType<Arguments>(key)
        return typeof key === 'string' && key.startsWith('swr')
      },
      data => {
        expectType<number | undefined>(data)
        return 0
      }
    )
  )

  expect<Promise<string | undefined>>(
    mutate<string>('string', data => {
      expectType<string | undefined>(data)
      return '0'
    })
  )

  mutate<string>('string', data => {
    expectType<string | undefined>(data)
    return '0'
  })
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
