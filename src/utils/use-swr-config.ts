import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'
import { FullConfiguration, Cache } from '../types'

export const useSWRConfig = <
  T extends Cache = Map<string, any>
>(): FullConfiguration<T> => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
