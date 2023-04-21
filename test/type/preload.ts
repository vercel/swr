import { preload } from 'swr'
import { expectType } from './utils'
import type { Equal } from '@type-challenges/utils'

export function testPreload() {
  const data1 = preload('key', () => Promise.resolve('value' as const))
  expectType<Equal<Promise<'value'>, typeof data1>>(true)

  const data2 = preload(
    () => 'key',
    () => 'value' as const
  )
  expectType<Equal<'value', typeof data2>>(true)

  const data3 = preload<'value'>(
    () => 'key',
    () => 'value' as const
  )
  // specifing a generic param breaks the rest type inference so get FetcherResponse<"value">
  expectType<Equal<'value' | Promise<'value'>, typeof data3>>(true)

  preload('key', key => {
    expectType<Equal<'key', typeof key>>(true)
  })

  preload<'value'>(
    'key',
    (
      // @ts-expect-error -- infered any implicitly
      key
    ) => {
      return 'value' as const
    }
  )

  preload(['key', 1], keys => {
    expectType<Equal<[string, number], typeof keys>>(true)
  })

  preload(
    () => 'key' as const,
    key => {
      expectType<Equal<'key', typeof key>>(true)
    }
  )
}
