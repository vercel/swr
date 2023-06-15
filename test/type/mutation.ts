import useSWRMutation from 'swr/mutation'
import { expectType } from './utils'
import type { TriggerWithoutArgs } from '../../mutation/src/types'

export function useConfigMutation() {
  const { trigger } = useSWRMutation('key', k => k)
  expectType<TriggerWithoutArgs<'key', any, string, never>>(trigger)
}
