import useSWRSuspense from 'swr/suspense'
import useSWRInfiniteSuspense from 'swr/infinite/suspense'

const fetcher = async (_key: string) => 'data'

export function useTestSuspenseEntry() {
  const { data, isLoading } = useSWRSuspense('key', fetcher)
  const value: string = data
  const loading: false = isLoading

  return { value, loading }
}

export function useTestInfiniteSuspenseEntry() {
  const { data, isLoading } = useSWRInfiniteSuspense(
    index => `key-${index}`,
    fetcher
  )
  const value: string[] = data
  const loading: false = isLoading

  return { value, loading }
}
