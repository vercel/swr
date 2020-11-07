import { createContext } from 'react'

import { ConfigInterface } from './types'

const SWRConfigContext = createContext<ConfigInterface | null>(null)
SWRConfigContext.displayName = 'SWRConfigContext'

export default SWRConfigContext
