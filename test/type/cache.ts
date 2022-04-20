import { useSWRConfig } from 'swr'
import { expectType } from './utils'

export function useSWRLooseCache() {
  const { cache } = useSWRConfig()
  expectType<any>(cache.values())
}

export function useSWRMapCache() {
  const cache = useSWRConfig().cache as Map<string, any>
  expectType<Map<string, any>['values']>(cache.values)
}
