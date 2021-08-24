import { isFunction } from './helper'

import { Key, Fetcher, SWRConfiguration } from '../types'

export function normalize<KeyType = Key, Data = any>(
  args:
    | readonly [KeyType]
    | readonly [KeyType, Fetcher<Data> | null]
    | readonly [KeyType, SWRConfiguration | undefined]
    | readonly [KeyType, Fetcher<Data> | null, SWRConfiguration | undefined]
): [KeyType, Fetcher<Data> | null, Partial<SWRConfiguration<Data>>] {
  return isFunction(args[1])
    ? [args[0], args[1], args[2] || {}]
    : [args[0], null, (args[1] === null ? args[2] : args[1]) || {}]
}
