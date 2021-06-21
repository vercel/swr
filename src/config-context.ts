import { createContext, createElement, useContext, FC } from 'react'

import mergeConfig from './libs/merge-config'
import { SWRConfiguration } from './types'

export const SWRConfigContext = createContext<SWRConfiguration>({})

const SWRConfig: FC<{
  value: SWRConfiguration
}> = ({ children, value }) => {
  // Extend parent context values and middlewares.
  value = mergeConfig(useContext(SWRConfigContext) || {}, value)
  return createElement(SWRConfigContext.Provider, { value }, children)
}

export default SWRConfig
