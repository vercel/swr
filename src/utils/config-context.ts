import { createContext, createElement, useContext, useState, FC } from 'react'

import { defaultProvider } from './config'
import { wrapCache } from './cache'
import mergeConfig from './merge-config'
import { UNDEFINED } from './helper'
import {
  SWRConfiguration,
  FullConfiguration,
  ConfigOptions,
  Cache
} from '../types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

const SWRConfig: FC<{
  value?: SWRConfiguration
  provider?: (cache: Readonly<Cache>) => Cache
  providerOptions?: Partial<ConfigOptions>
}> = ({ children, value, provider, providerOptions }) => {
  // Extend parent context values and middlewares.
  const extendedConfig = mergeConfig(useContext(SWRConfigContext), value)
  const currentCache = extendedConfig.cache || defaultProvider[0]

  // Use a lazy initialized state to create the cache on first access.
  const [cache] = useState(() => {
    if (provider || providerOptions) {
      return wrapCache(
        provider ? provider(currentCache) : currentCache,
        providerOptions
      )[0]
    }
    return UNDEFINED
  })

  // Override the cache if created.
  if (cache) extendedConfig.cache = cache

  return createElement(
    SWRConfigContext.Provider,
    { value: extendedConfig },
    children
  )
}

export default SWRConfig
