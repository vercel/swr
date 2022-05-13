import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'
import { FullConfiguration, Cache } from '../types'

export const useSWRConfig = <
<<<<<<< HEAD:src/utils/use-swr-config.ts
  T extends Cache = Cache
=======
  T extends Cache = Map<string, any>
>>>>>>> b8114e6 (refactor: switch to useSyncExternalStoreWithSelector (#1953)):_internal/utils/use-swr-config.ts
>(): FullConfiguration<T> => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
