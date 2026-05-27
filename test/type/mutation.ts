import useSWRMutation, {
  type MutationFetcher,
  type TriggerWithoutArgs
} from 'swr/mutation'
import { expectType } from './utils'

export function useConfigMutation() {
  const { trigger } = useSWRMutation('key', k => k)
  expectType<TriggerWithoutArgs<'key', any, string, never>>(trigger)
}

export function useGenericMutation<
  Key extends string = string,
  Data = unknown,
  ExtraArg = unknown
>(key: Key, fetcher: MutationFetcher<Data, Key, ExtraArg>) {
  const { trigger } = useSWRMutation(key, fetcher)

  trigger({ someArg: 'value' } as ExtraArg)
}
