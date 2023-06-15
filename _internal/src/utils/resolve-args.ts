import { mergeConfigs } from './merge-config'
import { normalize } from './normalize-args'
import { useSWRConfig } from './use-swr-config'
import { BUILT_IN_MIDDLEWARE } from './middleware-preset'

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

    // Apply middleware
    let next = hook
    const { use } = config
    const middleware = (use || []).concat(BUILT_IN_MIDDLEWARE)
    for (let i = middleware.length; i--; ) {
      next = middleware[i](next)
    }

    return next(key, fn || config.fetcher || null, config)
  } as unknown as SWRType
}
