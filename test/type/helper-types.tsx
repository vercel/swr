import type { BlockingData } from '../../_internal/types'
import { expectType } from './utils'

export function testDataCached() {
  expectType<BlockingData<string, { fallbackData: string }>>(true)
  expectType<BlockingData<any, { suspense: true }>>(true)
  expectType<
    BlockingData<string, { fallbackData?: string; revalidate: boolean }>
  >(false)
  expectType<BlockingData<false, { suspense: false; revalidate: boolean }>>(
    false
  )
}
