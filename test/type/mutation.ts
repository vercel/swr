import useSWRMutation, { type TriggerWithoutArgs } from 'swr/mutation'
import { expectType } from './utils'

export function useConfigMutation() {
  const { trigger } = useSWRMutation('key', k => k)
  expectType<TriggerWithoutArgs<'key', any, string, never>>(trigger)
}

export function useOptimisticDataMutation() {
  // `optimisticData` is forwarded to the core mutate, which calls it with both
  // the committed data and the data currently displayed. Both parameters must
  // be visible to callers here, and both are typed as the SWR data.
  useSWRMutation('key', (k: string) => k, {
    optimisticData: (currentData, displayedData) => {
      expectType<string | undefined>(currentData)
      expectType<string | undefined>(displayedData)
      return 'optimistic'
    }
  })

  // Callbacks that ignore the extra parameters must keep type-checking.
  useSWRMutation('key', (k: string) => k, {
    optimisticData: currentData => {
      expectType<string | undefined>(currentData)
      return 'optimistic'
    }
  })
  useSWRMutation('key', (k: string) => k, {
    optimisticData: () => 'optimistic'
  })

  // The non-function form stays supported.
  useSWRMutation('key', (k: string) => k, {
    optimisticData: 'optimistic'
  })
}
