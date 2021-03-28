import { useContext } from 'react'

import defaultConfig from './config'
import SWRConfigContext from './config-context'

import { Fetcher } from './types'

// Resolve arguments for SWR hooks.
// This function itself is a hook because it uses `useContext` inside.
export default function useArgs<KeyType, ConfigType, Data>(
  args:
    | readonly [KeyType]
    | readonly [KeyType, Fetcher<Data> | null]
    | readonly [KeyType, ConfigType | undefined]
    | readonly [KeyType, Fetcher<Data> | null, ConfigType | undefined]
): [KeyType, (typeof defaultConfig) & ConfigType, Fetcher<Data> | null] {
  const config = Object.assign(
    {},
    defaultConfig,
    useContext(SWRConfigContext),
    args.length > 2
      ? args[2]
      : args.length === 2 && typeof args[1] === 'object'
      ? args[1]
      : {}
  ) as (typeof defaultConfig) & ConfigType

  // In TypeScript `args.length > 2` is not same as `args.lenth === 3`.
  // We do a safe type assertion here.
  const fn = (args.length > 2
    ? args[1]
    : args.length === 2 && typeof args[1] === 'function'
    ? args[1]
    : // Pass fn as null will disable revalidate
    // https://paco.sh/blog/shared-hook-state-with-swr
    args[1] === null
    ? args[1]
    : config.fetcher) as Fetcher<Data> | null

  return [args[0], config, fn]
}
