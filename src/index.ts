// Core APIs
export { SWRConfig, mutate, createCache } from './use-swr'
export { serialize } from './utils/serialize'

// useSWR
import useSWR from './use-swr'
export default useSWR

// Types
export {
  SWRConfiguration,
  Revalidator,
  RevalidatorOptions,
  Key,
  KeyLoader,
  SWRResponse,
  Cache,
  SWRHook,
  Fetcher,
  MutatorCallback,
  Middleware
} from './types'
