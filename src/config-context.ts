import { createContext, createElement, useContext, FC } from 'react'

import { SWRConfiguration } from './types'

export const SWRConfigContext = createContext<SWRConfiguration>({})

const SWRConfig: FC<{
  value: SWRConfiguration
}> = ({ children, value }) => {
  // Extend middlewares of parent config context.
  const parentConfigContext = useContext(SWRConfigContext)
  if (parentConfigContext && parentConfigContext.middlewares) {
    value = {
      ...value,
      middlewares: [
        ...parentConfigContext.middlewares,
        ...(value.middlewares || [])
      ]
    }
  }

  return createElement(SWRConfigContext.Provider, { value }, children)
}

export default SWRConfig
