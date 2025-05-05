import type { BlockingData } from 'swr/_internal'
import { expectType } from '../utils'

declare module 'swr' {
  interface SWRGlobalConfig {
    suspense: true
  }
}

export function testDataCached() {
  expectType<BlockingData<string, { fallbackData: string }>>(true)
  expectType<BlockingData<any, { suspense: true }>>(true)
  expectType<
    BlockingData<string, { fallbackData?: string; revalidate: boolean }>
  >(true)
  expectType<BlockingData<false, { suspense: false; revalidate: boolean }>>(
    true
  )
}
