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
import { UNDEFINED, mergeObjects, isFunction, isUndefined } from './shared'
import { useIsomorphicLayoutEffect } from './env'
import { SWRGlobalState } from './global-state'
import type { SWRConfigValue, FullConfiguration, GlobalState } from '../types'

export const SWRConfigContext = createContext<Partial<FullConfiguration>>({})

const SWRConfig: FC<
  PropsWithChildren<{
    value?: SWRConfigValue | ((parentConfig?: SWRConfigValue) => SWRConfigValue)
  }>
> = props => {
  const { value } = props
  const parentConfig = useContext(SWRConfigContext)
  const isFunctionalConfig = isFunction(value)
  const config = useMemo(
    () => (isFunctionalConfig ? value(parentConfig as SWRConfigValue) : value),
    [isFunctionalConfig, parentConfig, value]
  )
  // Extend parent context values and middleware.
  const extendedConfig = useMemo(
    () => (isFunctionalConfig ? config : mergeConfigs(parentConfig, config)),
    [isFunctionalConfig, parentConfig, config]
  )

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

  const cacheData = extendedConfig && extendedConfig.cacheData
  if (cacheData) {
    const targetCache = (extendedConfig as any).cache || defaultCache
    const [, , , PRELOAD] = SWRGlobalState.get(targetCache) as GlobalState
    for (const key in cacheData) {
      if (
        key &&
        isUndefined(targetCache.get(key)?.data) &&
        isUndefined(PRELOAD[key])
      ) {
        PRELOAD[key] = {
          data: cacheData[key],
          _cacheData: true
        }
      }
    }
  }

  // Unsubscribe events.
  useIsomorphicLayoutEffect(() => {
    if (cacheContext) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
