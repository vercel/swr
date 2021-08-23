import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'

export const useSWRConfig = () => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
