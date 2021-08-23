import { createContext, createElement, useContext, useState, FC } from 'react'

import { defaultProvider } from './config'
import { wrapCache } from './cache'
import mergeConfig from './merge-config'
import { isFunction, UNDEFINED } from './helper'
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
  options?: Partial<ConfigOptions>
}> = ({ children, value, provider, options }) => {
  // Extend parent context values and middlewares.
  const extendedConfig = mergeConfig(useContext(SWRConfigContext), value)
  const currentCache = extendedConfig.cache || defaultProvider[0]

  // Use a lazy initialized state to create the cache on first access.
  const [cache] = useState(() => {
    if (isFunction(provider)) {
      return wrapCache(provider(currentCache), options)[0]
    }
    if (options) {
      return wrapCache(currentCache, options)[0]
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
