import { mergeConfigs } from './merge-config'
import { normalize } from './normalize-args'
import { useSWRConfig } from './use-swr-config'
import { isUndefined, OBJECT } from './helper'

// It's tricky to pass generic types as parameters, so we just directly override
// the types here.
export const withArgs = <SWRType>(hook: any) => {
  return function useSWRArgs(...args: any) {
    // Get the default and inherited configuration.
    const fallbackConfig = useSWRConfig()

    // Normalize arguments.
    const [key, fn, _config] = normalize<any, any>(args)

    // Merge configurations.
    const config = mergeConfigs(fallbackConfig, _config)
    const { fallback, fallbackData, fetcher, use } = config

    // Apply middleware.
    let next = hook
    if (use) {
      for (let i = use.length; i-- > 0; ) {
        next = use[i](next)
      }
    }

    // Execute all the middleware and SWR hooks.
    const swr = next(key, fn || fetcher, config)

    // Extend the returned SWR object with fallback data.
    const extended = {}
    for (const k in swr) {
      OBJECT.defineProperty(extended, k, {
        enumerable: true,
        get() {
          if (k == 'data') {
            if (!isUndefined(swr.data)) return swr.data

            // Apply fallback data.
            return fallback && isUndefined(fallbackData)
              ? fallback[key]
              : fallbackData
          }

          return swr[k]
        }
      })
    }
    return extended
  } as unknown as SWRType
}
