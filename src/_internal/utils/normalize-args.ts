import { isFunction } from './shared'

import type { Key, Fetcher, SWRConfiguration } from '../types'

export const normalize = <KeyType = Key, Data = any>(
  args:
    | [KeyType]
    | [KeyType, Fetcher<Data> | null]
    | [KeyType, SWRConfiguration | undefined]
    | [KeyType, Fetcher<Data> | null, SWRConfiguration | undefined]
): [KeyType, Fetcher<Data> | null, Partial<SWRConfiguration<Data>>] => {
  // An explicit `null` fetcher disables the request and must override an
  // inherited global fetcher. Since the hook falls back to `config.fetcher`
  // when the normalized fetcher argument is falsy, we set `fetcher: null` in
  // the hook-level config so the config merge resolves to `null` instead of
  // restoring the inherited fetcher. An omitted or `undefined` fetcher still
  // inherits the global one.
  return isFunction(args[1])
    ? [args[0], args[1], args[2] || {}]
    : [
        args[0],
        null,
        (args[1] === null ? { ...args[2], fetcher: null } : args[1]) || {}
      ]
}
