import { useContext } from 'react'

import defaultConfig from './config'
import { SWRConfigContext } from './config-context'
import mergeConfig from './libs/merge-config'

import { Fetcher, SWRConfiguration } from './types'

// Resolve arguments for SWR hooks.
// This function itself is a hook because it uses `useContext` inside.
function useArgs<KeyType, Data>(
  args:
    | readonly [KeyType]
    | readonly [KeyType, Fetcher<Data> | null]
    | readonly [KeyType, SWRConfiguration | undefined]
    | readonly [KeyType, Fetcher<Data> | null, SWRConfiguration | undefined]
): [KeyType, Fetcher<Data> | null, (typeof defaultConfig) & SWRConfiguration] {
  const fallbackConfig = {
    ...defaultConfig,
    ...useContext(SWRConfigContext)
  }
  const currentConfig = (args.length > 2
    ? args[2]
    : args.length === 2 && typeof args[1] === 'object'
    ? args[1]
    : {}) as (typeof defaultConfig) & SWRConfiguration

  // Merge configs.
  const config = mergeConfig(
    fallbackConfig,
    currentConfig
  ) as (typeof defaultConfig) & SWRConfiguration

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

  return [args[0], fn, config]
}

// It's tricky to pass generic types as parameters, so we just directly override
// the types here.
export default function withArgs<SWRType>(hook: any) {
  return (((...args: any) => {
    const [key, fn, config] = useArgs<any, any>(args)

    // Apply middlewares to the hook.
    let next = hook
    const { middlewares } = config
    if (middlewares) {
      for (let i = 0; i < middlewares.length; i++) {
        next = middlewares[i](next)
      }
    }

    return next(key, fn, config)
  }) as unknown) as SWRType
}
