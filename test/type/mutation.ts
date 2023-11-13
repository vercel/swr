import useSWRMutation, { type TriggerWithoutArgs } from 'swr/mutation'
import { expectType } from './utils'

export function useConfigMutation() {
  const { trigger } = useSWRMutation('key', k => k)
  expectType<TriggerWithoutArgs<'key', any, string, never>>(trigger)
}
