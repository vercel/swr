// useSWR
import useSWR from './use-swr'
export default useSWR

// Core APIs
export { SWRConfig, unstable_serialize } from './use-swr'
export { useSWRConfig } from './utils/use-swr-config'
export { mutate } from './utils/config'

// Types
export {
  SWRConfiguration,
  Revalidator,
  RevalidatorOptions,
  Key,
  KeyLoader,
  KeyedMutator,
  SWRResponse,
  Cache,
  SWRHook,
  Fetcher,
  MutatorCallback,
  Middleware,
  Arguments
} from './types'
