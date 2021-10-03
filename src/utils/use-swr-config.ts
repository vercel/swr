import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'
import { FullConfiguration, Cache } from '../types'

export const useSWRConfig: <
  CustomCache extends Cache = Map<string | null, any>
>() => FullConfiguration<CustomCache> = () => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
