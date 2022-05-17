import { useSWRConfig, Cache, State } from 'swr'
import { expectType } from './utils'

interface CustomCache<Data = any> extends Cache<Data> {
  reset(): void
}

export function useTestCache() {
  expectType<Map<string, State>>(useSWRConfig().cache)
  expectType<Map<string, State>>(useSWRConfig<Map<string, State>>().cache)
  expectType<CustomCache>(useSWRConfig<CustomCache>().cache)
}
