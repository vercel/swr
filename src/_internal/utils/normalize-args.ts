import { isFunction } from './shared'

import type { Key, Fetcher, SWRConfiguration } from '../types'

export const normalize = <KeyType = Key, Data = any>(
  args:
    | [KeyType]
    | [KeyType, Fetcher<Data> | null]
    | [KeyType, SWRConfiguration | undefined]
    | [KeyType, Fetcher<Data> | null | undefined, SWRConfiguration | undefined]
): [
  KeyType,
  Fetcher<Data> | null | undefined,
  Partial<SWRConfiguration<Data>>
] => {
  if (isFunction(args[1])) {
    return [args[0], args[1], args[2] || {}]
  }

  const fetcher = args[1] === null ? null : undefined
  const config = args[1] === null || args[1] === undefined ? args[2] : args[1]
  return [args[0], fetcher, config || {}]
}
