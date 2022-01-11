import { useContext } from 'react'
import { defaultConfig } from './config'
import { SWRConfigContext } from './config-context'
import { mergeObjects } from './helper'
import { FullConfiguration } from '../types'

export const useSWRConfig = (): FullConfiguration => {
  return mergeObjects(defaultConfig, useContext(SWRConfigContext))
}
