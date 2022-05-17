import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'
import { FullConfiguration, Cache, State } from '../types'

export const useSWRConfig = <
  T extends Cache = Map<string, State>
>(): FullConfiguration<T> => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
