import { createContext } from 'react'

import { SWRConfiguration } from './types'

const SWRConfigContext = createContext<SWRConfiguration>({})
SWRConfigContext.displayName = 'SWRConfigContext'

export default SWRConfigContext
