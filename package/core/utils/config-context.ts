import { createContext, createElement, useContext, useState, FC } from 'react'
import { cache as defaultCache } from './config'
import { initCache } from './cache'
import { mergeConfigs } from './merge-config'
import { UNDEFINED, mergeObjects } from './helper'
import { useIsomorphicLayoutEffect } from './env'
import {
  SWRConfiguration,
  FullConfiguration,
  ProviderConfiguration,
  Cache
} from '../types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

const SWRConfig: FC<{
  value?: SWRConfiguration &
    Partial<ProviderConfiguration> & {
      provider?: (cache: Readonly<Cache>) => Cache
    }
}> = props => {
  const { value } = props

  // Extend parent context values and middleware.
  const extendedConfig = mergeConfigs(useContext(SWRConfigContext), value)

  // Should not use the inherited provider.
  const provider = value && value.provider

  // Use a lazy initialized state to create the cache on first access.
  const [cacheContext] = useState(() =>
    provider
      ? initCache(provider(extendedConfig.cache || defaultCache), value)
      : UNDEFINED
  )

  // Override the cache if a new provider is given.
  if (cacheContext) {
    extendedConfig.cache = cacheContext[0]
    extendedConfig.mutate = cacheContext[1]
  }

  // Unsubscribe events.
  useIsomorphicLayoutEffect(
    () => (cacheContext ? cacheContext[2] : UNDEFINED),
    []
  )

  return createElement(
    SWRConfigContext.Provider,
    mergeObjects(props, {
      value: extendedConfig
    })
  )
}

export default SWRConfig
