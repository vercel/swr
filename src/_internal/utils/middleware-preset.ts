import { getDevToolsUse } from './devtools'
import { middleware as preload } from './preload'

export const getBuiltinMiddleware = () => {
  return getDevToolsUse().concat(preload)
}
