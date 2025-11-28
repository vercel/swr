import useSWR from 'swr'
import { expectType } from '../utils'

declare module 'swr' {
  interface SWRGlobalConfig {
    suspense: true
  }
}

export function useTestSuspense() {
  const { data } = useSWR('/api', (k: string) => Promise.resolve(k))
  expectType<string>(data)
}
