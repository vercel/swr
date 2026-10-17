import type { BlockingData, SWRConfiguration } from 'swr/_internal'
import type { SWRInfiniteConfiguration } from 'swr/infinite'
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

export function testFetcherConfigurationNull() {
  const config: SWRConfiguration = {
    fetcher: null
  }
  const infiniteConfig: SWRInfiniteConfiguration = {
    fetcher: null
  }
  return [config, infiniteConfig]
}
