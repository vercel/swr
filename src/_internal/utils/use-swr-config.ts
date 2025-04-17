import { useContext, useMemo } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './shared'
import type { FullConfiguration } from '../types'

export const useSWRConfig = (): FullConfiguration => {
  const parentConfig = useContext(SWRConfigContext)
  const mergedConfig = useMemo(
    () => mergeObjects(defaultConfig, parentConfig),
    [parentConfig]
  )
  return mergedConfig
}
