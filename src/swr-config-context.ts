import { createContext } from 'react'

import { ConfigInterface } from './types'

const SWRConfigContext = createContext<Partial<ConfigInterface>>({})
SWRConfigContext.displayName = 'SWRConfigContext'

export default SWRConfigContext
