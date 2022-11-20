import { isFunction } from './helper'

import type { Key, Fetcher, SWRConfiguration } from '../types'

export const normalize = <KeyType = Key, Data = any>(
  args:
    | [KeyType]
    | [KeyType, Fetcher<Data> | null | undefined]
    | [KeyType, SWRConfiguration | undefined]
    | [KeyType, Fetcher<Data> | null | undefined, SWRConfiguration | undefined]
): [
  KeyType,
  Fetcher<Data> | null | undefined,
  Partial<SWRConfiguration<Data>>
] => {
  return isFunction(args[1]) || args[1] === null
    ? [args[0], args[1], args[2] || {}]
    : [args[0], undefined, args[1] || {}]
}
