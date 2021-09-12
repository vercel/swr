import {
  createContext,
  createElement,
  useContext,
  useState,
  FC,
  useEffect
} from 'react'
import { cache as defaultCache } from './config'
import { initCache } from './cache'
import { mergeConfigs } from './merge-config'
import { isFunction, UNDEFINED } from './helper'
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
  // Extend parent context values and middleware.
  const extendedConfig = mergeConfigs(useContext(SWRConfigContext), value)

  // Should not use the inherited provider.
  const provider = value && value.provider

  // Use a lazy initialized state to create the cache on first access.
  const [cacheHandle] = useState(() =>
    provider
      ? initCache(provider(extendedConfig.cache || defaultCache), value)
      : UNDEFINED
  )

  // Override the cache if a new provider is given.
  if (cacheHandle) {
    extendedConfig.cache = cacheHandle[0]
    extendedConfig.mutate = cacheHandle[1]
  }

  useEffect(() => {
    return () => {
      const unsubscribe = cacheHandle ? cacheHandle[2] : UNDEFINED
      isFunction(unsubscribe) && unsubscribe()
    }
  }, [])

  return createElement(
    SWRConfigContext.Provider,
    { value: extendedConfig },
    children
  )
}

export default SWRConfig
