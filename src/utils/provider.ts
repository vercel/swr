import { useContext, useState } from 'react'
import { defaultConfig } from './config'
import { wrapCache } from './cache'
import { isFunction } from './helper'
import { SWRConfigContext } from './config-context'
import { SWRGlobalState, GlobalState } from './global-state'

import { Cache, ProviderOptions } from '../types'

export const useSWRProvider = <Data = any>(
  initialize?: ((cache: Readonly<Cache>) => Cache) | Partial<ProviderOptions>,
  options?: Partial<ProviderOptions>
) => {
  const cache = useContext(SWRConfigContext).cache || defaultConfig.cache

  // We use a state to keep the cache instance and make sure it's only
  // initialized once.
  return useState(() => {
    if (isFunction(initialize)) {
      return wrapCache<Data>(initialize(cache), options)
    } else if (initialize) {
      return wrapCache<Data>(cache, initialize)
    }

    // If no arg is present, return the current provider.
    return {
      cache,
      mutate: (SWRGlobalState.get(cache) as GlobalState)[6]
    }
  })[0]
}
