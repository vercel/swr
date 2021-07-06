// Core APIs
export { SWRConfig, mutate, createCache } from './use-swr'

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
  Middleware,
  // Legacy, for backwards compatibility
  ConfigInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface
} from './types'
