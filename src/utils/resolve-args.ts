import { useContext } from 'react'

import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeConfigs } from './merge-config'
import { normalize } from './normalize-args'
import { mergeObjects } from './helper'

// It's tricky to pass generic types as parameters, so we just directly override
// the types here.
export default function withArgs<SWRType>(hook: any) {
  return (((...args: any) => {
    // Normalize arguments.
    const [key, fn, _config] = normalize<any, any>(args)

    // Get the default and inherited configuration.
    const fallbackConfig = mergeObjects(
      defaultConfig,
      useContext(SWRConfigContext)
    )

    // Merge configurations.
    const config = mergeConfigs(fallbackConfig, _config)

    // Apply middleware
    let next = hook
    const { use } = config
    if (use) {
      for (let i = use.length; i-- > 0; ) {
        next = use[i](next)
      }
    }

    return next(key, fn || config.fetcher, config)
  }) as unknown) as SWRType
}
