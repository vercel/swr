import {
  createContext,
  createElement,
  useContext,
  useState,
  ReactElement
} from 'react'
import { cache as defaultCache } from './config'
import { initCache } from './cache'
import { mergeConfigs } from './merge-config'
import { UNDEFINED } from './helper'
import { useIsomorphicLayoutEffect } from './env'
import {
  SWRConfiguration,
  FullConfiguration,
  ProviderConfiguration,
  Cache
} from '../types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

type Provider<Data = any> = (cache: Cache<Data>) => Cache<Data>
type SWRConfigValue = SWRConfiguration &
  Partial<ProviderConfiguration> & {
    provider?: Provider<any>
  }

const SWRConfig = ({
  value,
  children
}: {
  value?: SWRConfigValue
  children?: React.ReactNode
}): ReactElement | null => {
  // Extend parent context values and middleware.
  const extendedConfig = mergeConfigs(useContext(SWRConfigContext), value)
  const cache = extendedConfig.cache || defaultCache
  // Should not use the inherited provider.
  const provider = value && value.provider

  // Use a lazy initialized state to create the cache on first access.
  const [cacheContext] = useState(() =>
    provider ? initCache(provider(cache), value) : UNDEFINED
  )

  // Override the cache if a new provider is given.
  if (cacheContext) {
    extendedConfig.cache = cacheContext[0] as Cache
    extendedConfig.mutate = cacheContext[1]
  }

  // Unsubscribe events.
  useIsomorphicLayoutEffect(
    () => (cacheContext ? cacheContext[2] : UNDEFINED),
    []
  )

  return createElement(
    SWRConfigContext.Provider,
    { value: extendedConfig },
    children
  )
}

export default SWRConfig
