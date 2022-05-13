import { useSWRConfig, Cache } from 'swr'
import { expectType } from './utils'

interface CustomCache<Data = any> extends Cache<Data> {
  reset(): void
}

export function useTestCache() {
  expectType<Cache>(useSWRConfig().cache)
  expectType<CustomCache>(useSWRConfig<CustomCache>().cache)
}
