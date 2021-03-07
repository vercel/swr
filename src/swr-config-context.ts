import { createContext } from 'react'

import { SWRContext } from './types'

const SWRConfigContext = createContext<SWRContext>({})
SWRConfigContext.displayName = 'SWRConfigContext'

export default SWRConfigContext
