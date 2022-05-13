import { useSWRConfig, Cache } from 'swr'
import { expectType } from './utils'

interface CustomCache<Data = any> extends Cache<Data> {
  reset(): void
}

export function useTestCache() {
  expectType<Map<string, any>>(useSWRConfig().cache)
  expectType<Map<string, number>>(useSWRConfig<Map<string, number>>().cache)
  expectType<CustomCache>(useSWRConfig<CustomCache>().cache)
}
