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

    // A locally-provided positional fetcher (`fn`) always takes precedence.
    // Only treat the fetcher as explicitly null when there's no local
    // fetcher and either `null` was passed positionally or the merged
    // config's fetcher is null.
    const hasExplicitNullFetcher =
      !fn && (args[1] === null || config.fetcher === null)
    if (hasExplicitNullFetcher) {
      config.fetcher = null
    }

    return next(
      key,
      hasExplicitNullFetcher ? null : fn || config.fetcher || null,
      config
    )
  } as unknown as SWRType
}
