import { useContext } from 'react'

import defaultConfig from './config'
import { SWRConfigContext } from './config-context'
import mergeConfig from './merge-config'

import { Key, Fetcher, Middleware, SWRConfiguration, SWRHook } from '../types'

function normalize<KeyType = Key, Data = any>(
  args:
    | readonly [KeyType]
    | readonly [KeyType, SWRConfiguration | undefined]
    | readonly [KeyType, Fetcher<Data> | null, SWRConfiguration | undefined]
): [KeyType, Fetcher<Data> | null, Partial<SWRConfiguration<Data>>] {
  return typeof args[1] === 'function'
    ? [args[0], args[1], args[2] || {}]
    : [args[0], null, (typeof args[1] === 'object' ? args[1] : args[2]) || {}]
}

// Create a custom hook with a middleware
export function withMiddleware(
  useSWR: SWRHook,
  middleware: Middleware
): SWRHook {
  return <Data = any, Error = any>(
    ...args:
      | readonly [Key]
      | readonly [Key, SWRConfiguration | undefined]
      | readonly [Key, Fetcher<Data> | null, SWRConfiguration | undefined]
  ) => {
    const [key, fn, config] = normalize(args)
    config.middlewares = (config.middlewares || []).concat(middleware)
    return useSWR<Data, Error>(key, fn, config)
  }
}

// It's tricky to pass generic types as parameters, so we just directly override
// the types here.
export default function withArgs<SWRType>(hook: any) {
  return (((...args: any) => {
    // Normalize arguments.
    const [key, fn, _config] = normalize<any, any>(args)

    // Get the default and inherited configuration.
    const fallbackConfig = {
      ...defaultConfig,
      ...useContext(SWRConfigContext)
    }
    // Merge configurations.
    const config = mergeConfig(fallbackConfig, _config)

    // Apply middlewares.
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
