import { isFunction } from './shared'

import type { Key, Fetcher, SWRConfiguration } from '../types'

export const normalize = <KeyType = Key, Data = any>(
  args:
    | [KeyType]
    | [KeyType, Fetcher<Data> | null]
    | [KeyType, SWRConfiguration | undefined]
    | [KeyType, Fetcher<Data> | null, SWRConfiguration | undefined]
): [KeyType, Fetcher<Data> | null, Partial<SWRConfiguration<Data>>] => {
  return isFunction(args[1])
    ? [args[0], args[1], args[2] || {}]
    : [args[0], null, (args[1] === null ? args[2] : args[1]) || {}]
}
