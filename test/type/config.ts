import { useSWRConfig, Cache, CacheValue } from 'swr'
import { expectType } from './utils'

interface CustomCache<Data = any> extends Cache<Data> {
  reset(): void
}

export function useTestCache() {
  expectType<Map<string, CacheValue>>(useSWRConfig().cache)
  expectType<Map<string, CacheValue>>(
    useSWRConfig<Map<string, CacheValue>>().cache
  )
  expectType<CustomCache>(useSWRConfig<CustomCache>().cache)
}
