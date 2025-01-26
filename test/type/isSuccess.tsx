import useSWR from 'swr'
import { expectType } from './utils'

export function useIsSuccess() {
  const fetcherResult = 'helloWorld'
  const { data, isSuccess } = useSWR('key', () => fetcherResult)
  expectType<typeof data>(fetcherResult)
  expectType<typeof data>(undefined)
  if (isSuccess) {
    expectType<typeof data>(fetcherResult)
  }
}
