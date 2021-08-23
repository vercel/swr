import { createContext, createElement, useContext, useState, FC } from 'react'

import { defaultProvider } from './config'
import { initCache } from './cache'
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
  value?: SWRConfiguration & Partial<ConfigOptions>
  provider?: (cache: Readonly<Cache>) => Cache
}> = ({ children, value, provider }) => {
  // Extend parent context values and middlewares.
  const extendedConfig = mergeConfig(useContext(SWRConfigContext), value)
  const currentCache = extendedConfig.cache || defaultProvider[0]

  // Use a lazy initialized state to create the cache on first access.
  const [cache] = useState(() =>
    provider ? initCache(provider(currentCache), value) : UNDEFINED
  )

  // Override the cache if a new provider is given.
  if (cache) {
    extendedConfig.cache = cache[0]
  }

  return createElement(
    SWRConfigContext.Provider,
    { value: extendedConfig },
    children
  )
}

export default SWRConfig
