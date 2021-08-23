import { createContext, createElement, useContext, useState, FC } from 'react'

import { defaultProvider } from './config'
import { initCache } from './cache'
import { mergeConfigs } from './merge-config'
import { UNDEFINED } from './helper'
import {
  SWRConfiguration,
  FullConfiguration,
  ConfigOptions,
  Cache
} from '../types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

const SWRConfig: FC<{
  value?: SWRConfiguration &
    Partial<ConfigOptions> & {
      provider?: (cache: Readonly<Cache>) => Cache
    }
}> = ({ children, value }) => {
  // Extend parent context values and middlewares.
  const extendedConfig = mergeConfigs(useContext(SWRConfigContext), value)

  // Should not use the inherited provider.
  const provider = value && value.provider

  // Use a lazy initialized state to create the cache on first access.
  const [cacheAndMutate] = useState(() =>
    provider
      ? initCache(provider(extendedConfig.cache || defaultProvider[0]), value)
      : UNDEFINED
  )

  // Override the cache if a new provider is given.
  if (cacheAndMutate) {
    extendedConfig.cache = cacheAndMutate[0]
    extendedConfig.mutate = cacheAndMutate[1]
  }

  return createElement(
    SWRConfigContext.Provider,
    { value: extendedConfig },
    children
  )
}

export default SWRConfig
