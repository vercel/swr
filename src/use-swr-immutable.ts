import { useSWRHandler } from './use-swr'
import { SWRHook } from './types'
import withArgs from './resolve-args'

export default withArgs<SWRHook>(useSWRHandler, [])
