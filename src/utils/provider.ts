import { useContext, useState } from 'react'
import { defaultConfig } from './config'
import { wrapCache } from './cache'
import { isFunction, UNDEFINED } from './helper'
import { SWRConfigContext } from './config-context'
import { SWRGlobalState, GlobalState } from './global-state'

import { Cache, ProviderOptions } from '../types'

export const useSWRProvider = <Data = any>(
  initialize?:
    | ((currentCache: Readonly<Cache>) => Cache)
    | Partial<ProviderOptions>,
  options?: Partial<ProviderOptions>
) => {
  const cache = useContext(SWRConfigContext).cache || defaultConfig.cache

  // We use a state to keep the cache instance and make sure it's only
  // initialized once.
  const [newProvider] = useState(() => {
    if (isFunction(initialize))
      return wrapCache<Data>(initialize(cache), options)
    else if (initialize) {
      return wrapCache<Data>(cache, initialize)
    }
    return UNDEFINED
  })

  // Return the new provider if it's created, otherwise return the current
  // provider.
  return (
    newProvider || {
      cache,
      mutate: (SWRGlobalState.get(cache) as GlobalState)[6]
    }
  )
}
