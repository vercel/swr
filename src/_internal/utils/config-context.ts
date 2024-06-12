'use client'

import type { FC, PropsWithChildren } from 'react'
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useRef
} from 'react'
import { cache as defaultCache } from './config'
import { initCache } from './cache'
import { mergeConfigs } from './merge-config'
import { UNDEFINED, mergeObjects, isFunction } from './shared'
import { useIsomorphicLayoutEffect } from './env'
import type { SWRConfiguration, FullConfiguration } from '../types'
import { isPromise } from 'util/types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

const SWRConfig: FC<
  PropsWithChildren<{
    value?:
      | SWRConfiguration
      | ((parentConfig?: SWRConfiguration) => SWRConfiguration)
  }>
> = props => {
  const { value } = props
  const parentConfig = useContext(SWRConfigContext)
  const isFunctionalConfig = isFunction(value)
  const config = useMemo(
    () => (isFunctionalConfig ? value(parentConfig) : value),
    [isFunctionalConfig, parentConfig, value]
  )
  // Extend parent context values and middleware.
  const extendedConfig = useMemo(() => {
    const normalizedConfig = isFunctionalConfig
      ? config
      : mergeConfigs(parentConfig, config)
    if (normalizedConfig?.fallback) {
      for (const key in normalizedConfig.fallback) {
        const fallback = normalizedConfig.fallback[key]
        if (isPromise(fallback)) {
          normalizedConfig.fallback[key] = fallback.catch(() => {})
        }
      }
    }
    return normalizedConfig
  }, [isFunctionalConfig, parentConfig, config])

  // Should not use the inherited provider.
  const provider = config && config.provider

  // initialize the cache only on first access.
  const cacheContextRef = useRef<ReturnType<typeof initCache>>(UNDEFINED)
  if (provider && !cacheContextRef.current) {
    cacheContextRef.current = initCache(
      provider((extendedConfig as any).cache || defaultCache),
      config
    )
  }
  const cacheContext = cacheContextRef.current

  // Override the cache if a new provider is given.
  if (cacheContext) {
    ;(extendedConfig as any).cache = cacheContext[0]
    ;(extendedConfig as any).mutate = cacheContext[1]
  }

  // Unsubscribe events.
  useIsomorphicLayoutEffect(() => {
    if (cacheContext) {
      cacheContext[2] && cacheContext[2]()
      return cacheContext[3]
    }
  }, [])

  return createElement(
    SWRConfigContext.Provider,
    mergeObjects(props, {
      value: extendedConfig
    })
  )
}

export default SWRConfig
