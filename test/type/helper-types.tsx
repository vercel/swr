import type { DataCached } from '../../_internal/types'
import { expectType } from './utils'

export function testDataCached() {
  expectType<DataCached<{ fallbackData: string }>>(true)
  expectType<DataCached<{ suspense: true }>>(true)
  expectType<DataCached<{ fallbackData?: string; revalidate: boolean }>>(false)
  expectType<DataCached<{ suspense: false; revalidate: boolean }>>(false)
}
