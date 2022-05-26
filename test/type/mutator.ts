import { Equal, Expect } from '@type-challenges/utils'
import useSWR, { useSWRConfig } from 'swr'

import {
  MutatorFn,
  Key,
  MutatorCallback,
  Mutator,
  MutatorWrapper
} from '../../_internal/types'
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
        expectType<string>(key)
        return key.startsWith('swr')
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
        expectType<string>(key)
        return key.startsWith('swr')
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
